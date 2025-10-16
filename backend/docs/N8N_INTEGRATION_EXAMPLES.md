# n8n Integration Examples with Client Vector Tables

This document provides examples of how to integrate n8n workflows with the client-specific vector tables.

## Prerequisites

1. Configure PostgreSQL connection in n8n
2. Ensure pgvector extension is enabled
3. Have the client's `userId` available in your workflow

## Example 1: Similarity Search for RAG

### Workflow Overview
1. Receive user query
2. Generate embedding for the query
3. Search client's vector table for similar chunks
4. Use retrieved chunks as context for LLM

### n8n PostgreSQL Node Configuration

**Node: Postgres - Vector Search**

**Operation:** Execute Query

**Query:**
```sql
SELECT 
  chunk_text,
  metadata,
  document_id,
  (embedding <=> $1::vector) as distance
FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
ORDER BY distance ASC
LIMIT $2
```

**Query Parameters:**
```json
{
  "parameters": [
    "{{ $json.queryEmbedding }}",  // Array formatted as string: "[0.123, 0.456, ...]"
    5                                // Limit to top 5 results
  ]
}
```

### Complete Workflow Steps

**Step 1: Webhook/Trigger**
```json
{
  "query": "What are your business hours?",
  "userId": "clx1a2b3c4d5e6f7g8h9",
  "channelId": "whatsapp"
}
```

**Step 2: OpenAI - Generate Query Embedding**
- Model: `text-embedding-3-small`
- Input: `{{ $json.query }}`
- Output: Store in `queryEmbedding`

**Step 3: Code Node - Format Embedding**
```javascript
// Convert embedding array to PostgreSQL vector format
const embedding = $input.first().json.queryEmbedding;
const embeddingString = `[${embedding.join(',')}]`;

return {
  json: {
    queryEmbedding: embeddingString,
    userId: $input.first().json.userId,
    originalQuery: $input.first().json.query
  }
};
```

**Step 4: PostgreSQL - Vector Search** (see query above)

**Step 5: Code Node - Format Context**
```javascript
// Combine retrieved chunks into context
const items = $input.all();
const chunks = items.map(item => item.json.chunk_text);
const context = chunks.join('\n\n');

return {
  json: {
    context: context,
    query: $input.first().json.originalQuery,
    sourceDocs: items.map(item => ({
      documentId: item.json.document_id,
      chunkIndex: item.json.metadata?.chunk_index,
      distance: item.json.distance
    }))
  }
};
```

**Step 6: OpenAI - Generate Response**
```javascript
System Prompt:
You are a helpful AI assistant. Use the following context to answer the user's question.
If the answer is not in the context, say so.

Context:
{{ $json.context }}

User Question:
{{ $json.query }}
```

## Example 2: Search Within Specific Document

Sometimes you want to search only within a specific document (e.g., user uploaded a document and wants to ask questions about it).

**Query:**
```sql
SELECT 
  chunk_text,
  metadata,
  (embedding <=> $1::vector) as distance
FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
WHERE document_id = $2
ORDER BY distance ASC
LIMIT $3
```

**Parameters:**
```json
{
  "parameters": [
    "{{ $json.queryEmbedding }}",
    "{{ $json.documentId }}",
    5
  ]
}
```

## Example 3: Store Message in Channel-Specific Table

For storing conversation messages in the appropriate channel table.

**Query for WhatsApp:**
```sql
INSERT INTO whatsapp_messages (session_id, message, client_id, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id, created_at
```

**Parameters:**
```javascript
const sessionId = `${clientId}_whatsapp_${customerId}`;
const message = {
  type: 'text',
  content: messageContent,
  timestamp: new Date().toISOString(),
  isFromBot: true
};

return {
  json: {
    parameters: [
      sessionId,
      JSON.stringify(message),
      clientId,
      customerId
    ]
  }
};
```

## Example 4: Get Client's Vector Statistics

Useful for monitoring and analytics.

**Query:**
```sql
SELECT 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT document_id) as total_documents,
  pg_size_pretty(pg_total_relation_size('client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks')) as table_size,
  MIN(created_at) as oldest_chunk,
  MAX(created_at) as newest_chunk
FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
```

## Example 5: Hybrid Search (Keyword + Semantic)

Combine full-text search with vector similarity for better results.

**Query:**
```sql
WITH keyword_matches AS (
  SELECT 
    id,
    chunk_text,
    metadata,
    ts_rank(to_tsvector('english', chunk_text), plainto_tsquery('english', $1)) as keyword_score
  FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
  WHERE to_tsvector('english', chunk_text) @@ plainto_tsquery('english', $1)
),
vector_matches AS (
  SELECT 
    id,
    chunk_text,
    metadata,
    (embedding <=> $2::vector) as vector_distance,
    (1 - (embedding <=> $2::vector)) as vector_score
  FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
  ORDER BY vector_distance
  LIMIT 20
)
SELECT 
  v.chunk_text,
  v.metadata,
  COALESCE(k.keyword_score, 0) * 0.3 + v.vector_score * 0.7 as combined_score
FROM vector_matches v
LEFT JOIN keyword_matches k ON v.id = k.id
ORDER BY combined_score DESC
LIMIT $3
```

**Parameters:**
```json
{
  "parameters": [
    "{{ $json.keywords }}",        // Keywords extracted from query
    "{{ $json.queryEmbedding }}",  // Vector embedding
    5                               // Limit
  ]
}
```

## Example 6: Multi-Document Context Building

Build context from multiple documents with weighted relevance.

**Query:**
```sql
WITH ranked_chunks AS (
  SELECT 
    chunk_text,
    document_id,
    metadata,
    (embedding <=> $1::vector) as distance,
    ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY (embedding <=> $1::vector)) as rank_in_doc
  FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
)
SELECT 
  chunk_text,
  document_id,
  metadata->>'fileName' as file_name,
  distance,
  rank_in_doc
FROM ranked_chunks
WHERE rank_in_doc <= 2  -- Max 2 chunks per document
ORDER BY distance
LIMIT $2
```

## Example 7: Delete All Vectors for a Document

When a client deletes a document from their knowledge base.

**Query:**
```sql
DELETE FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
WHERE document_id = $1
RETURNING COUNT(*) as deleted_count
```

**Parameters:**
```json
{
  "parameters": [
    "{{ $json.documentId }}"
  ]
}
```

## Common Helper Functions for n8n Code Nodes

### Format Embedding for PostgreSQL
```javascript
function formatEmbedding(embeddingArray) {
  return `[${embeddingArray.join(',')}]`;
}

// Usage
const formatted = formatEmbedding($json.embedding);
```

### Generate Session ID
```javascript
function generateSessionId(clientId, channel, customerId) {
  return `${clientId}_${channel}_${customerId}`;
}

// Usage
const sessionId = generateSessionId(
  $json.clientId,
  'whatsapp',
  $json.customerId
);
```

### Extract Client ID from Session ID
```javascript
function extractFromSessionId(sessionId) {
  const parts = sessionId.split('_');
  return {
    clientId: parts[0],
    channel: parts[1],
    customerId: parts[2]
  };
}

// Usage
const info = extractFromSessionId($json.sessionId);
```

### Sanitize User ID for Table Name
```javascript
function sanitizeUserIdForTable(userId) {
  return userId.replace(/-/g, '_');
}

// Usage in expressions
{{ $json.userId.replace(/-/g, '_') }}
```

## Error Handling

### Handle Table Not Found
```javascript
try {
  // Your PostgreSQL query
} catch (error) {
  if (error.message.includes('does not exist')) {
    // Vector table doesn't exist for this client
    return {
      json: {
        error: 'Client vector table not initialized',
        action: 'contact_support',
        userId: $input.first().json.userId
      }
    };
  }
  throw error;
}
```

### Handle Empty Results
```javascript
const results = $input.all();

if (results.length === 0) {
  return {
    json: {
      context: 'No relevant information found in the knowledge base.',
      shouldFallback: true,
      query: $input.first().json.query
    }
  };
}

// Process results normally
```

## Performance Tips

1. **Use Limits Wisely**: Don't retrieve more chunks than needed
   - For simple Q&A: 3-5 chunks
   - For complex queries: 5-10 chunks
   - Maximum recommended: 20 chunks

2. **Filter When Possible**: Use WHERE clauses to narrow search
   ```sql
   WHERE metadata->>'category' = 'product_info'
   ```

3. **Batch Operations**: When processing multiple queries, use batch inserts

4. **Index Monitoring**: For clients with >10k vectors, consider increasing IVFFlat lists

5. **Connection Pooling**: Reuse PostgreSQL connections in n8n workflows

## Security Considerations

1. **Always use parameterized queries** - Never concatenate user input directly
2. **Validate userId** - Ensure it matches authenticated user
3. **Sanitize table names** - Use the replace function to prevent SQL injection
4. **Limit result sizes** - Prevent resource exhaustion with reasonable LIMIT values
5. **Monitor query performance** - Set timeouts for vector searches

## Testing Your Integration

### Test Vector Search
```javascript
// In n8n Code Node
const testUserId = 'clx1a2b3c4d5e6f7g8h9';
const testEmbedding = new Array(1536).fill(0); // Dummy embedding
const formattedEmbedding = `[${testEmbedding.join(',')}]`;

return {
  json: {
    userId: testUserId,
    queryEmbedding: formattedEmbedding
  }
};
```

### Verify Table Exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'client_vectors' 
  AND table_name = 'client_{{ $json.userId.replace(/-/g, '_') }}_chunks'
) as table_exists
```

## Additional Resources

- [PostgreSQL Vector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [n8n PostgreSQL Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres/)

