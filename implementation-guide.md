# Implementation Guide - Step by Step

## Summary of Changes Required

### Critical Fixes (Must Do)

1. **vectorService.js** - Add error handling, input validation
2. **documentService.js** - Implement actual file processing & text extraction
3. **clientController.js** - uploadDocument: Trigger document processing
4. **authController.js** - register: Create vector table on new user registration
5. **errorHandler.js** - Better error responses

### Why These Changes Fix the Problems

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| Documents never process | uploadDocument only saves metadata, never calls processDocument() | Updated uploadDocument to trigger async processing |
| No file text extracted | No file reading logic after multer upload | Added fs.readFile in processDocument |
| User vector table never created | No createClientVectorTable() call on registration | Added in authController register function |
| Missing chatbot relation | Document model doesn't link to chatbot | Use client_id to get user, query chatbot settings |
| Embedding generation fails silently | No error handling in loops, no try-catch per chunk | Wrapped in try-catch with per-chunk recovery |
| OpenAI API key not validated | No startup check for missing key | Added validation + warning in vectorService.js |
| SQL injection risk | Dynamic table names without sanitization | Kept sanitization in getClientVectorTableName (already safe) |

---

## Detailed Implementation Steps

### Step 1: Fix vectorService.js

**Location**: `backend/src/services/vectorService.js`

**Changes**:
- Add API key validation on module load
- Wrap embedding calls in error handler
- Add per-chunk error recovery in storeDocumentVectors
- Add input validation to all functions
- Better error messages

**Key additions**:
```javascript
// Validate on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY not set')
}

// Per-chunk error handling
for (let i = 0; i < chunks.length; i++) {
  try {
    // Store chunk
    successCount++
  } catch (chunkError) {
    failedChunks.push({ index: i, error: chunkError.message })
  }
}
```

**Why it matters**: 
- Detects API key issues early
- Continues processing even if one chunk fails
- Better debugging information

---

### Step 2: Fix documentService.js

**Location**: `backend/src/services/documentService.js`

**Major Changes**:

1. **New function: extractTextFromFile()**
   ```javascript
   const fileContent = await fs.readFile(filePath, 'utf-8')
   ```
   This ACTUALLY reads the file from disk

2. **Fix processDocument() signature**
   - OLD: `processDocument(documentId, content, metadata)`
   - NEW: `processDocument(documentId, filePath, fileType)`
   - Reads the file inside the function

3. **Add error recovery**
   ```javascript
   for (let i = 0; i < chunks.length; i++) {
     try {
       const embedding = await generateEmbedding(chunks[i])
       embeddings.push(embedding)
     } catch (embeddingError) {
       failedEmbeddings.push(i)
       embeddings.push(null) // Mark as failed
     }
   }
   // Filter out nulls
   ```

4. **Use client_id instead of chatbot relation**
   ```javascript
   // OLD: document.chatbot.userId (doesn't work)
   // NEW: document.client_id (uses existing field)
   const userId = document.client_id
   ```

5. **Temporary file cleanup**
   ```javascript
   await fs.unlink(filePath) // Delete file after processing
   ```

**Why it matters**:
- Actually processes the uploaded file
- Handles partial failures gracefully
- Cleans up disk space
- Works with existing schema

---

### Step 3: Fix clientController.js

**Location**: `backend/src/controllers/clientController.js`

**Find the uploadDocument function and update**:

**Old code problem**:
```javascript
const document = await prisma.document.create({ data: {...} })
res.json({ message: 'Document uploaded successfully', document })
// ❌ MISSING: processDocument never called!
```

**New code**:
```javascript
const document = await prisma.document.create({ data: {...} })

// Start processing asynchronously
processDocument(document.id, path, mimetype)
  .then(() => console.log('Processing complete'))
  .catch((err) => console.error('Processing failed:', err))

// Return immediately
res.json({ message: 'Document uploaded. Processing started.', document })
```

**Why it matters**:
- File path is passed to processDocument
- Processing happens in background (doesn't block response)
- User gets immediate feedback

---

### Step 4: Fix authController.js

**Location**: `backend/src/controllers/authController.js`

**Find the register function and add after user creation**:

```javascript
import { createClientVectorTable } from '../services/clientVectorService.js'

const user = await prisma.user.create({ data: {...} })

// NEW: Create vector table for this user
try {
  await createClientVectorTable(user.id)
  console.log(`✅ Vector table created for ${user.id}`)
} catch (vectorError) {
  console.error(`⚠️ Vector table creation failed:`, vectorError.message)
  // Don't fail registration, just warn
}
```

**Why it matters**:
- New users automatically get vector tables
- No manual setup required
- Vector storage works immediately on document upload

---

### Step 5: Create/Update errorHandler.js

**Location**: `backend/src/middleware/errorHandler.js`

**Content**:
```javascript
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Vector-specific errors
  if (err.message.includes('vector table') || err.message.includes('does not exist')) {
    return res.status(500).json({
      error: 'Vector database not initialized',
      detail: err.message,
      code: 'VECTOR_DB_ERROR'
    })
  }

  if (err.message.includes('OPENAI_API_KEY')) {
    return res.status(500).json({
      error: 'Embedding service not configured',
      code: 'EMBEDDING_CONFIG_ERROR'
    })
  }

  // Generic error
  res.status(500).json({ error: err.message })
}
```

**Why it matters**:
- Better error messages to clients
- Helps with debugging
- Professional error responses

---

## Configuration Checklist

### Required Environment Variables

Add to `.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/saas
```

### Database Setup

Already exists (no schema changes needed):
- `documents` table with `client_id` field ✅
- `chatbots` table with `userId` field ✅
- `client_vectors` schema (created by migration) ✅
- Vector tables per client (created by `createClientVectorTable()`) ✅

### File System

Required directories:
```
backend/uploads/    # For temporary file storage
```

---

## Testing the Implementation

### Test 1: Vector Table Creation on Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "mobile": "1234567890",
    "company": "Test Co"
  }'

# Check logs:
# ✅ Vector table created for user_id
```

### Test 2: Document Upload & Processing

```bash
curl -X POST http://localhost:3001/api/client/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt" \
  -F "description=Test document"

# Response should show:
# "status": "PROCESSING"
# "note": "Document is being processed..."

# Check server logs for:
# 📄 Processing document...
# 📖 Extracting text...
# 🔪 Chunking with size=1000...
# 🤖 Generating embeddings...
# 💾 Storing vectors...
# ✅ Document processing complete
```

### Test 3: Check Document Status

```bash
curl -X GET http://localhost:3001/api/client/documents \
  -H "Authorization: Bearer YOUR_TOKEN"

# Document should eventually show:
# "status": "PROCESSED"
# "vectorCount": 42 (example)
```

### Test 4: Vector Search

```bash
# (Requires chatbot query endpoint - implement if needed)
# Search should return chunks with similarity scores
```

---

## Common Issues & Solutions

### Issue: "OPENAI_API_KEY not configured"

**Solution**:
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Restart server

### Issue: "Vector table does not exist"

**Solution**:
1. Run migration: `npx prisma migrate deploy`
2. Create tables for existing users: `node scripts/createVectorTablesForExistingClients.js`
3. New registrations should auto-create tables

### Issue: "Document stuck in PROCESSING"

**Causes**:
- OpenAI API key invalid
- File is empty or unreadable
- Network timeout

**Solution**:
1. Check server logs for detailed error
2. Verify file is valid text
3. Check OpenAI API status
4. Retry upload

### Issue: "Cannot find module 'fs/promises'"

**Solution**:
- Ensure Node.js 14+ (fs/promises is built-in)
- Check import statement: `import fs from 'fs/promises'`

### Issue: "Empty embeddings array"

**Possible causes**:
- All chunks failed to embed
- OpenAI API returned invalid response
- Rate limiting from OpenAI

**Solution**:
1. Check chunk size (shouldn't exceed 8191 tokens)
2. Verify file has valid text
3. Check OpenAI API limits

---

## Performance Optimization Tips

1. **Chunk Size**: 
   - Smaller chunks (500): More API calls, more accurate search
   - Larger chunks (2000): Fewer API calls, broader context

2. **Overlap**:
   - Higher overlap (300): More duplicates, better context continuity
   - Lower overlap (100): Less duplicates, faster processing

3. **Batch Processing**:
   - Process multiple documents in parallel (be mindful of rate limits)
   - Use Queue system (Bull/BullMQ) for production

4. **Caching**:
   - Cache frequently searched vectors
   - Cache generated embeddings for reuse

---

## Next Steps After Implementation

1. Test all functions with sample data
2. Monitor logs during document processing
3. Verify vectors appear in database
4. Implement chatbot query endpoint for search
5. Add progress tracking UI for document processing
6. Set up production OpenAI API plan
7. Monitor embedding generation costs

---

## Support & Debugging

### Enable Detailed Logging

Add to top of files:
```javascript
process.env.DEBUG='*' // Enable all debug logs
```

### Check Logs

```bash
# Follow server logs
npm run dev | tee server.log

# Search for errors
grep -i "error\|failed\|warning" server.log
```

### Database Debugging

```bash
# Connect to PostgreSQL
psql postgresql://user:pass@localhost:5432/saas_db

# Check vector tables created
\dt client_vectors.*

# Check document vectors
SELECT COUNT(*) FROM client_vectors.client_abc_chunks;
```

