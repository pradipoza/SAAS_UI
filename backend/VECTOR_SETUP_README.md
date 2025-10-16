# Vector Table Setup Guide

This guide explains the client-specific vector table architecture implemented in this SAAS application.

## 🎯 Overview

Each client gets their own dedicated PostgreSQL table for storing document embeddings (vectors). This provides:

- ✅ **Data Isolation**: Each client's vectors are physically separated
- ✅ **Customization**: Per-client configurations for chunk size, overlap, etc.
- ✅ **Performance**: Optimized indexes for each client
- ✅ **Security**: Better data isolation and access control
- ✅ **Scalability**: Easy to manage and scale individual clients
- ✅ **n8n Integration**: Direct access to client vectors in n8n workflows

## 📁 Table Structure

### Schema Organization
```
client_vectors/              (PostgreSQL schema)
  ├── client_abc123_chunks   (User 1's vector table)
  ├── client_def456_chunks   (User 2's vector table)
  └── client_ghi789_chunks   (User 3's vector table)
```

### Table Naming Convention
```
client_vectors.client_{userId}_chunks
```
Where `{userId}` is the user's ID with hyphens replaced by underscores.

## 🚀 Quick Start

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate deploy
```

This will create the `client_vectors` schema and enable the pgvector extension.

### 2. Create Vector Tables for Existing Clients (if any)

```bash
node scripts/createVectorTablesForExistingClients.js
```

This script will:
- Find all existing CLIENT users
- Check if they have vector tables
- Create missing vector tables
- Provide a summary report

### 3. Test the Setup

When a new client registers, their vector table is automatically created. To verify:

```javascript
import { clientVectorTableExists } from './src/services/clientVectorService.js'

const exists = await clientVectorTableExists(userId)
console.log(`Vector table exists: ${exists}`)
```

## 📝 How It Works

### 1. Client Registration

When a new client registers (`POST /api/auth/register`):

```javascript
// User is created in the database
const newUser = await prisma.user.create({ ... })

// Vector table is automatically created
await createClientVectorTable(newUser.id)
```

### 2. Document Upload & Processing

When a client uploads a document:

```javascript
// Document is saved
const document = await prisma.document.create({ ... })

// Document is processed (chunking + embedding)
await processDocument(documentId, fileContent)

// Inside processDocument:
// 1. Text is chunked based on chatbot settings
// 2. Each chunk is embedded using OpenAI
// 3. Vectors are stored in client's table
await storeDocumentVectors(userId, documentId, chunks, embeddings, metadata)
```

### 3. Vector Search (RAG)

When performing similarity search:

```javascript
// Generate query embedding
const queryEmbedding = await generateEmbedding(query)

// Search in client's vector table
const results = await searchSimilarVectors(
  userId,           // Client's user ID
  queryEmbedding,   // Query vector
  documentId,       // Optional: limit to specific document
  5                 // Limit: top 5 results
)

// Results contain relevant chunks with similarity scores
```

### 4. Document Deletion

When a client deletes a document:

```javascript
// Delete all vectors for this document
await deleteDocumentVectors(userId, documentId)

// Delete document record
await prisma.document.delete({ where: { id: documentId } })
```

## 🔧 API Reference

### clientVectorService.js

#### `createClientVectorTable(userId)`
Creates a new vector table for a client.

**Returns:**
```javascript
{
  success: true,
  schemaName: 'client_vectors',
  tableName: 'client_abc123_chunks',
  fullTableName: 'client_vectors.client_abc123_chunks'
}
```

#### `getClientVectorTableName(userId)`
Gets the full qualified table name.

**Returns:** `'client_vectors.client_abc123_chunks'`

#### `deleteClientVectorTable(userId)`
⚠️ **DANGER**: Deletes entire vector table for a client.

#### `clientVectorTableExists(userId)`
Checks if table exists.

**Returns:** `true` or `false`

#### `getClientVectorStats(userId)`
Gets statistics about client's vectors.

**Returns:**
```javascript
{
  total_chunks: 150,
  total_documents: 5,
  table_size: '2.5 MB'
}
```

### vectorService.js

#### `storeDocumentVectors(userId, documentId, chunks, embeddings, metadata)`
Stores vectors in client's table.

#### `searchSimilarVectors(userId, queryEmbedding, documentId, limit)`
Searches for similar vectors.

#### `deleteDocumentVectors(userId, documentId)`
Deletes all vectors for a document.

#### `getDocumentVectorCount(userId, documentId)`
Gets count of vectors for a document.

## 🔗 n8n Integration

### Basic Vector Search in n8n

**PostgreSQL Node Query:**
```sql
SELECT 
  chunk_text,
  metadata,
  (embedding <=> $1::vector) as distance
FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
ORDER BY distance ASC
LIMIT $2
```

**Parameters:**
- `$1`: Query embedding as string: `"[0.123, 0.456, ...]"`
- `$2`: Limit (e.g., 5)

See [N8N_INTEGRATION_EXAMPLES.md](./docs/N8N_INTEGRATION_EXAMPLES.md) for complete examples.

## 📊 Database Schema

### Vector Table Schema

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

### Indexes

1. **Vector Similarity Index (IVFFlat)**
   - For fast similarity search
   - Uses cosine distance
   - 100 lists (configurable)

2. **Document ID Index (B-tree)**
   - For fast document-based queries
   - Used in document deletion

3. **Metadata Chunk Index (GIN)**
   - For fast queries on chunk ordering
   - Used for retrieving chunks in document order

## 🐛 Troubleshooting

### Table Not Found

**Error:**
```
relation "client_vectors.client_xxx_chunks" does not exist
```

**Solution:**
```javascript
await createClientVectorTable(userId)
```

### Permission Denied

**Error:**
```
permission denied for schema client_vectors
```

**Solution:**
```sql
GRANT USAGE ON SCHEMA client_vectors TO your_db_user;
GRANT ALL ON ALL TABLES IN SCHEMA client_vectors TO your_db_user;
```

### Slow Searches

**Problem:** Vector searches taking >1 second

**Solution:** Rebuild index with more lists:
```sql
DROP INDEX client_vectors.client_xxx_chunks_embedding_idx;
CREATE INDEX client_xxx_chunks_embedding_idx 
ON client_vectors.client_xxx_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);
```

### Migration Failed

**Problem:** Migration script fails

**Solution:**
1. Check pgvector extension is installed:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Verify database permissions

3. Check PostgreSQL version (need 12+)

## 📚 Additional Documentation

- [CLIENT_VECTOR_TABLES.md](./docs/CLIENT_VECTOR_TABLES.md) - Detailed technical documentation
- [N8N_INTEGRATION_EXAMPLES.md](./docs/N8N_INTEGRATION_EXAMPLES.md) - n8n workflow examples

## 🔐 Security Notes

1. **Always use parameterized queries** in n8n
2. **Validate userId** before accessing tables
3. **Sanitize table names** (replace hyphens with underscores)
4. **Use service functions** instead of raw SQL when possible
5. **Monitor table sizes** for large clients

## 📈 Performance Tips

1. **Optimize index** for clients with >10,000 vectors
2. **Use reasonable limits** (5-10 chunks for most queries)
3. **Filter by document_id** when searching specific documents
4. **Batch operations** when processing multiple documents
5. **Monitor query times** and adjust IVFFlat lists accordingly

## 🧪 Testing

### Test Client Registration
```javascript
// Register new client
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    fullName: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    mobile: '1234567890',
    company: 'Test Company'
  })
})

// Verify vector table was created
const userId = response.user.id
const exists = await clientVectorTableExists(userId)
console.log('Vector table created:', exists) // Should be true
```

### Test Document Processing
```javascript
// Upload and process document
const document = await prisma.document.create({
  data: {
    chatbotId: chatbotId,
    filename: 'test.txt',
    originalName: 'test.txt',
    fileType: 'text/plain',
    fileSize: 1234,
    status: 'PROCESSING'
  }
})

await processDocument(document.id, 'Test content for embedding...')

// Verify vectors were stored
const count = await getDocumentVectorCount(userId, document.id)
console.log('Vectors stored:', count) // Should be > 0
```

### Test Vector Search
```javascript
// Generate query embedding
const queryEmbedding = await generateEmbedding('What is the return policy?')

// Search vectors
const results = await searchSimilarVectors(userId, queryEmbedding, null, 5)

console.log('Search results:', results)
// Should return array of similar chunks
```

## 🚨 Important Notes

1. **Vector tables are created automatically** during client registration
2. **Old `chunks` table is deprecated** - don't use it for new clients
3. **Each client's data is isolated** - no cross-client queries possible
4. **Table names use underscores** - hyphens in userId are replaced
5. **Deleting a user doesn't auto-delete their vector table** - implement cleanup if needed

## 🔄 Migration from Old System

If you have data in the old `chunks` table:

1. Identify which chunks belong to which client
2. Create vector tables for those clients
3. Migrate data to new tables
4. Verify data integrity
5. Drop old `chunks` table

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the detailed documentation
3. Check application logs for error messages
4. Verify database permissions and extensions

## ✅ Checklist

Before deploying:

- [ ] Run database migration
- [ ] Create vector tables for existing clients
- [ ] Test client registration flow
- [ ] Test document upload and processing
- [ ] Test vector search functionality
- [ ] Verify n8n integration (if applicable)
- [ ] Check database permissions
- [ ] Monitor performance on test data
- [ ] Update environment variables
- [ ] Document any custom configurations

## 🎉 You're All Set!

Your client-specific vector table system is now configured and ready to use. New clients will automatically get their own vector tables when they register, and all document operations will use the client-specific tables.

