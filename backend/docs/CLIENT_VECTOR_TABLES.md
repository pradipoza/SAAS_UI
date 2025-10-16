# Client-Specific Vector Tables

## Overview

Each client in the SAAS application has their own dedicated vector table for storing document embeddings. This architecture provides:

- **Isolation**: Each client's data is physically separated
- **Customization**: Vector table configurations can be customized per client
- **Performance**: Optimized indexes for each client's specific data
- **Scalability**: Easy to manage and scale individual client data

## Architecture

### Schema Organization

All client vector tables are stored in a dedicated PostgreSQL schema called `client_vectors`. This keeps them organized and separate from the main application tables.

### Table Naming Convention

Each client's vector table follows this naming pattern:
```
client_vectors.client_{userId}_chunks
```

Where `{userId}` is the client's user ID with hyphens replaced by underscores.

**Example:**
- User ID: `clx1a2b3c4d5e6f7g8h9`
- Table Name: `client_vectors.client_clx1a2b3c4d5e6f7g8h9_chunks`

### Table Structure

Each client vector table has the following structure:

```sql
CREATE TABLE client_vectors.client_{userId}_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier for each chunk |
| `document_id` | TEXT | Reference to the document this chunk belongs to |
| `chunk_text` | TEXT | The actual text content of the chunk |
| `embedding` | vector(1536) | OpenAI embedding vector (1536 dimensions) |
| `metadata` | JSONB | Additional metadata including chunk_index, filename, filetype, etc. |
| `created_at` | TIMESTAMP | When the chunk was created |
| `updated_at` | TIMESTAMP | When the chunk was last updated |

**Note:** `chunk_index` is stored within the `metadata` JSONB field, not as a separate column.

### Indexes

Each table includes three optimized indexes:

1. **Vector Similarity Index (IVFFlat)**
   ```sql
   CREATE INDEX {tableName}_embedding_idx 
   ON client_vectors.{tableName} 
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```
   - Enables fast similarity search using cosine distance
   - IVFFlat algorithm for approximate nearest neighbor search

2. **Document ID Index (B-tree)**
   ```sql
   CREATE INDEX {tableName}_document_id_idx 
   ON client_vectors.{tableName} (document_id);
   ```
   - Enables fast document-based queries
   - Used for bulk deletion when removing documents

3. **Metadata Chunk Index (GIN)**
   ```sql
   CREATE INDEX {tableName}_metadata_chunk_idx 
   ON client_vectors.{tableName} USING GIN ((metadata->'chunk_index'));
   ```
   - Enables fast queries on chunk ordering
   - Used for retrieving chunks in document order

## Service APIs

### clientVectorService.js

#### `createClientVectorTable(userId)`
Creates a new vector table for a client when they register.

**Usage:**
```javascript
import { createClientVectorTable } from './services/clientVectorService.js'

const result = await createClientVectorTable('clx1a2b3c4d5e6f7g8h9')
// Returns: { success: true, schemaName: 'client_vectors', tableName: '...' }
```

#### `getClientVectorTableName(userId)`
Returns the full qualified table name for a client.

**Usage:**
```javascript
const tableName = getClientVectorTableName('clx1a2b3c4d5e6f7g8h9')
// Returns: 'client_vectors.client_clx1a2b3c4d5e6f7g8h9_chunks'
```

#### `deleteClientVectorTable(userId)`
Deletes a client's entire vector table (use with caution!).

**Usage:**
```javascript
await deleteClientVectorTable('clx1a2b3c4d5e6f7g8h9')
```

#### `clientVectorTableExists(userId)`
Checks if a client's vector table exists.

**Usage:**
```javascript
const exists = await clientVectorTableExists('clx1a2b3c4d5e6f7g8h9')
// Returns: true or false
```

#### `getClientVectorStats(userId)`
Gets statistics about a client's vector table.

**Usage:**
```javascript
const stats = await getClientVectorStats('clx1a2b3c4d5e6f7g8h9')
// Returns: { total_chunks: 150, total_documents: 5, table_size: '2.5 MB' }
```

### vectorService.js (Updated)

#### `storeDocumentVectors(userId, documentId, chunks, embeddings, metadata)`
Stores document vectors in the client's table.

**Updated Parameters:**
- `userId`: The client's user ID (NEW - required)
- `documentId`: The document ID
- `chunks`: Array of text chunks
- `embeddings`: Array of embedding vectors
- `metadata`: Additional metadata

**Usage:**
```javascript
await storeDocumentVectors(
  userId, 
  documentId, 
  chunks, 
  embeddings, 
  { fileName: 'doc.pdf', fileType: 'pdf' }
)
```

#### `searchSimilarVectors(userId, queryEmbedding, documentId, limit)`
Searches for similar vectors in the client's table.

**Updated Parameters:**
- `userId`: The client's user ID (NEW - required)
- `queryEmbedding`: The query embedding vector
- `documentId`: Optional - limit search to specific document
- `limit`: Number of results to return

**Usage:**
```javascript
// Search across all client documents
const results = await searchSimilarVectors(userId, queryEmbedding, null, 5)

// Search within a specific document
const results = await searchSimilarVectors(userId, queryEmbedding, documentId, 5)
```

#### `deleteDocumentVectors(userId, documentId)`
Deletes all vectors for a specific document.

**Updated Parameters:**
- `userId`: The client's user ID (NEW - required)
- `documentId`: The document ID to delete

**Usage:**
```javascript
await deleteDocumentVectors(userId, documentId)
```

#### `getDocumentVectorCount(userId, documentId)`
Gets the count of vectors for a document.

**Usage:**
```javascript
const count = await getDocumentVectorCount(userId, documentId)
// Returns: 25
```

## Migration Guide

### From Old System to New System

The old system used a single `chunks` table for all clients. The new system uses individual tables per client.

**Old Approach:**
```sql
-- Single table for all clients
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  chunk_text TEXT,
  metadata JSONB,
  embedding vector(1536)
);
```

**New Approach:**
```sql
-- Separate table per client in dedicated schema
CREATE TABLE client_vectors.client_{userId}_chunks (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Running the Migration

1. **Apply the schema migration:**
   ```bash
   npx prisma migrate deploy
   ```

2. **The migration will:**
   - Create the `client_vectors` schema
   - Enable pgvector extension if needed
   - Set up proper permissions

3. **Existing users:**
   - New vector tables will be created automatically on first document upload
   - Or run a migration script to create tables for all existing users

4. **Old chunks table:**
   - Can be dropped after confirming all data is migrated
   - Or kept for historical purposes

## Integration with n8n

The n8n agent can access client vector tables directly using the same database connection.

### Example n8n Query

**Similarity Search:**
```sql
SELECT chunk_text, metadata, 
       (embedding <=> $1::vector) as distance
FROM client_vectors.client_{{userId}}_chunks
WHERE document_id = $2
ORDER BY distance
LIMIT 5
```

**Variables in n8n:**
- `$1`: Query embedding vector as string (e.g., `[0.123, 0.456, ...]`)
- `$2`: Document ID
- `{{userId}}`: Client user ID from workflow context

## Best Practices

1. **Always use the service functions** instead of raw SQL queries when possible
2. **Include userId** in all vector operations for proper table routing
3. **Monitor table sizes** using `getClientVectorStats()` for large clients
4. **Clean up** document vectors when documents are deleted
5. **Test vector operations** after client registration to ensure table exists

## Troubleshooting

### Table Not Found Error
```
Error: relation "client_vectors.client_xxx_chunks" does not exist
```

**Solution:** The client's vector table wasn't created during registration. Run:
```javascript
await createClientVectorTable(userId)
```

### Permission Denied
```
Error: permission denied for schema client_vectors
```

**Solution:** Ensure database user has proper permissions:
```sql
GRANT USAGE ON SCHEMA client_vectors TO your_database_user;
GRANT ALL ON ALL TABLES IN SCHEMA client_vectors TO your_database_user;
```

### Slow Similarity Search
```
Query takes >1 second for 10k+ vectors
```

**Solution:** Rebuild the IVFFlat index with more lists:
```sql
DROP INDEX IF EXISTS client_vectors.{tableName}_embedding_idx;
CREATE INDEX {tableName}_embedding_idx 
ON client_vectors.{tableName} 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);  -- Increase from 100 to 200
```

## Future Enhancements

- [ ] Automatic index optimization based on table size
- [ ] Vector compression for storage efficiency
- [ ] Multi-tenant query optimization
- [ ] Automated backup and restore for individual client tables
- [ ] Performance monitoring per client
- [ ] Table partitioning for very large clients

