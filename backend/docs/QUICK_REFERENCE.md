# Quick Reference - Client Vector Tables

## 🎯 Quick Commands

### Create Vector Table for a Client
```javascript
import { createClientVectorTable } from './services/clientVectorService.js'
await createClientVectorTable(userId)
```

### Store Document Vectors
```javascript
import { storeDocumentVectors } from './services/vectorService.js'
await storeDocumentVectors(userId, documentId, chunks, embeddings, metadata)
```

### Search Vectors
```javascript
import { searchSimilarVectors } from './services/vectorService.js'
const results = await searchSimilarVectors(userId, queryEmbedding, documentId, limit)
```

### Delete Document Vectors
```javascript
import { deleteDocumentVectors } from './services/vectorService.js'
await deleteDocumentVectors(userId, documentId)
```

### Get Vector Stats
```javascript
import { getClientVectorStats } from './services/clientVectorService.js'
const stats = await getClientVectorStats(userId)
```

## 📊 Table Name Format

**Pattern:** `client_vectors.client_{userId}_chunks`

**Example:**
- User ID: `clx1a2b3c4d5e6f7g8h9`
- Table: `client_vectors.client_clx1a2b3c4d5e6f7g8h9_chunks`

## 🔧 Common SQL Queries

### Vector Search
```sql
SELECT chunk_text, metadata, (embedding <=> $1::vector) as distance
FROM client_vectors.client_{userId}_chunks
ORDER BY distance
LIMIT 5
```

### Count Vectors
```sql
SELECT COUNT(*) FROM client_vectors.client_{userId}_chunks
WHERE document_id = $1
```

### Delete Document
```sql
DELETE FROM client_vectors.client_{userId}_chunks
WHERE document_id = $1
```

### Get Table Size
```sql
SELECT pg_size_pretty(pg_total_relation_size('client_vectors.client_{userId}_chunks'))
```

## 🚀 n8n Quick Template

```sql
SELECT chunk_text, metadata, (embedding <=> $1::vector) as distance
FROM client_vectors.client_{{ $json.userId.replace(/-/g, '_') }}_chunks
ORDER BY distance
LIMIT $2
```

**Parameters:** `[$1: embeddingString, $2: limit]`

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── clientVectorService.js  ← Client table management
│   │   ├── vectorService.js        ← Vector operations
│   │   └── documentService.js      ← Document processing
│   └── controllers/
│       └── authController.js       ← Auto-creates tables on signup
├── scripts/
│   └── createVectorTablesForExistingClients.js
├── docs/
│   ├── CLIENT_VECTOR_TABLES.md     ← Full documentation
│   ├── N8N_INTEGRATION_EXAMPLES.md ← n8n examples
│   └── QUICK_REFERENCE.md          ← This file
└── VECTOR_SETUP_README.md          ← Setup guide
```

## ⚡ Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `createClientVectorTable` | clientVectorService.js | Create table for new client |
| `getClientVectorTableName` | clientVectorService.js | Get table name for client |
| `storeDocumentVectors` | vectorService.js | Store chunks + embeddings |
| `searchSimilarVectors` | vectorService.js | RAG similarity search |
| `deleteDocumentVectors` | vectorService.js | Delete document vectors |
| `getDocumentVectorCount` | vectorService.js | Count vectors for document |
| `processDocument` | documentService.js | Chunk + embed + store |

## 🔍 Debugging

### Check if table exists
```javascript
import { clientVectorTableExists } from './services/clientVectorService.js'
const exists = await clientVectorTableExists(userId)
console.log('Exists:', exists)
```

### List all client tables
```javascript
import { listClientVectorTables } from './services/clientVectorService.js'
const tables = await listClientVectorTables()
console.log('Tables:', tables)
```

### Get client stats
```javascript
const stats = await getClientVectorStats(userId)
console.log('Stats:', stats)
// { total_chunks: 150, total_documents: 5, table_size: '2.5 MB' }
```

## 🎯 Workflow Integration Points

### 1. Registration → Create Table
```
POST /auth/register
  ↓
Create User
  ↓
createClientVectorTable(userId)  ← Auto
```

### 2. Upload Document → Process → Store
```
POST /documents/upload
  ↓
Save Document Record
  ↓
processDocument(documentId, content)
  ↓
storeDocumentVectors(userId, documentId, chunks, embeddings)
```

### 3. Query → Search → Respond
```
User Query
  ↓
Generate Embedding
  ↓
searchSimilarVectors(userId, embedding)
  ↓
Build Context
  ↓
LLM Response
```

### 4. Delete Document → Clean Vectors
```
DELETE /documents/:id
  ↓
deleteDocumentVectors(userId, documentId)
  ↓
Delete Document Record
```

## 🛠️ Environment Variables

None required specifically for vector tables. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - For embeddings

## ⚠️ Important Notes

1. **Auto-created on signup** - No manual intervention needed
2. **Isolated per client** - Cannot query across clients
3. **Sanitized names** - Hyphens → underscores
4. **Indexed for speed** - IVFFlat + B-tree indexes
5. **1536 dimensions** - OpenAI text-embedding-3-small

## 🔗 Links

- [Full Documentation](./CLIENT_VECTOR_TABLES.md)
- [n8n Examples](./N8N_INTEGRATION_EXAMPLES.md)
- [Setup Guide](../VECTOR_SETUP_README.md)

