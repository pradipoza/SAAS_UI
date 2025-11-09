import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { getClientVectorTableName } from './clientVectorService.js'

// Validate API key on module load
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY not set. Embedding generation will fail.')
} else {
  console.log('✅ OpenAI API key configured')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const prisma = new PrismaClient()

export const generateEmbedding = async (text, model = 'text-embedding-3-small') => {
  // Input validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid text input: text must be a non-empty string')
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured. Please set the environment variable.')
  }

  try {
    const response = await openai.embeddings.create({
      model: model,
      input: text
    })
    
    if (!response?.data?.[0]?.embedding) {
      throw new Error('Invalid response from OpenAI API: missing embedding data')
    }
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('OPENAI_API_KEY is invalid or expired')
    }
    
    throw new Error(`Failed to generate embedding: ${error.message || 'Unknown error'}`)
  }
}

export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  // Input validation
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input: text must be a string')
  }
  
  if (typeof chunkSize !== 'number' || chunkSize <= 0) {
    throw new Error('Invalid chunkSize: must be a positive number')
  }
  
  if (typeof overlap !== 'number' || overlap < 0 || overlap >= chunkSize) {
    throw new Error('Invalid overlap: must be a non-negative number less than chunkSize')
  }
  
  // If text is shorter than chunkSize, return single chunk
  if (text.length <= chunkSize) {
    return [text]
  }
  
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    
    // Only add non-empty chunks
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    // If we've reached the end of the text, we're done
    if (end >= text.length) {
      break
    }
    
    // Calculate next start position with overlap
    const nextStart = end - overlap
    
    // Ensure we always move forward (prevent infinite loops)
    // If overlap would cause us to go backwards or stay in place, move forward by at least 1
    start = Math.max(nextStart, start + 1)
    
    // Safety check: if we're not making progress, break
    if (start >= end) {
      break
    }
  }
  
  return chunks
}

/**
 * Store document vectors in client-specific vector table
 * @param {string} userId - The client's user ID
 * @param {string} documentId - The document ID
 * @param {Array} chunks - Array of text chunks
 * @param {Array} embeddings - Array of embeddings
 * @param {Object} metadata - Additional metadata
 */
export const storeDocumentVectors = async (userId, documentId, chunks, embeddings, metadata = {}) => {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string')
  }
  
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId: must be a non-empty string')
  }
  
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Invalid chunks: must be a non-empty array')
  }
  
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error('Invalid embeddings: must be a non-empty array')
  }
  
  if (chunks.length !== embeddings.length) {
    throw new Error(`Mismatch: chunks length (${chunks.length}) must equal embeddings length (${embeddings.length})`)
  }
  
  if (metadata && typeof metadata !== 'object') {
    throw new Error('Invalid metadata: must be an object')
  }

  try {
    const vectorTableName = getClientVectorTableName(userId)
    
    let successCount = 0
    const failedChunks = []
    
    // Store vectors in the client's dedicated table with per-chunk error recovery
    for (let i = 0; i < chunks.length; i++) {
      try {
        // Validate chunk and embedding
        if (!chunks[i] || typeof chunks[i] !== 'string') {
          throw new Error(`Invalid chunk at index ${i}: must be a non-empty string`)
        }
        
        if (!Array.isArray(embeddings[i]) || embeddings[i].length === 0) {
          throw new Error(`Invalid embedding at index ${i}: must be a non-empty array`)
        }
        
        const embeddingString = `[${embeddings[i].join(',')}]`
        
        // Include chunk_index in metadata
        const chunkMetadata = {
          ...metadata,
          chunk_index: i
        }
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO ${vectorTableName} (document_id, chunk_text, embedding, metadata)
          VALUES ($1, $2, $3::vector, $4::jsonb)
        `, documentId, chunks[i], embeddingString, JSON.stringify(chunkMetadata))
        
        successCount++
      } catch (chunkError) {
        console.error(`Error storing chunk ${i}:`, chunkError)
        failedChunks.push({ 
          index: i, 
          error: chunkError.message || 'Unknown error',
          chunk: chunks[i]?.substring(0, 50) + '...' // Log first 50 chars for debugging
        })
      }
    }
    
    if (successCount === 0) {
      throw new Error(`Failed to store any vectors. All ${chunks.length} chunks failed.`)
    }
    
    if (failedChunks.length > 0) {
      console.warn(`⚠️ Warning: ${failedChunks.length} out of ${chunks.length} chunks failed to store`)
    }
    
    return { 
      success: true, 
      vectorCount: successCount,
      failedCount: failedChunks.length,
      failedChunks: failedChunks.length > 0 ? failedChunks : undefined
    }
  } catch (error) {
    console.error('Error storing vectors:', error)
    
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      throw new Error(`Vector table does not exist for user ${userId}. Please ensure the vector table is created.`)
    }
    
    throw new Error(`Failed to store document vectors: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Search for similar vectors in client-specific table
 * @param {string} userId - The client's user ID
 * @param {Array} queryEmbedding - The query embedding vector
 * @param {string} documentId - Optional: limit search to specific document
 * @param {number} limit - Number of results to return
 */
export const searchSimilarVectors = async (userId, queryEmbedding, documentId = null, limit = 5) => {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string')
  }
  
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('Invalid queryEmbedding: must be a non-empty array')
  }
  
  if (documentId !== null && (typeof documentId !== 'string' || documentId.trim().length === 0)) {
    throw new Error('Invalid documentId: must be a non-empty string or null')
  }
  
  if (typeof limit !== 'number' || limit <= 0) {
    throw new Error('Invalid limit: must be a positive number')
  }

  try {
    const vectorTableName = getClientVectorTableName(userId)
    const embeddingString = `[${queryEmbedding.join(',')}]`
    
    let query
    let params
    
    if (documentId) {
      // Search within a specific document
      query = `
        SELECT chunk_text, metadata, document_id,
               (embedding <=> $1::vector) as distance
        FROM ${vectorTableName}
        WHERE document_id = $2
        ORDER BY distance
        LIMIT $3
      `
      params = [embeddingString, documentId, limit]
    } else {
      // Search across all documents for this client
      query = `
        SELECT chunk_text, metadata, document_id,
               (embedding <=> $1::vector) as distance
        FROM ${vectorTableName}
        ORDER BY distance
        LIMIT $2
      `
      params = [embeddingString, limit]
    }
    
    const results = await prisma.$queryRawUnsafe(query, ...params)
    
    return results
  } catch (error) {
    console.error('Error searching vectors:', error)
    
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      throw new Error(`Vector table does not exist for user ${userId}`)
    }
    
    throw new Error(`Failed to search similar vectors: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Delete all vectors for a specific document from client's table
 * @param {string} userId - The client's user ID
 * @param {string} documentId - The document ID to delete
 */
export const deleteDocumentVectors = async (userId, documentId) => {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string')
  }
  
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId: must be a non-empty string')
  }

  try {
    const vectorTableName = getClientVectorTableName(userId)
    
    console.log(`🗑️ Deleting vectors for document ${documentId} from table ${vectorTableName}`)
    
    // First, check how many chunks exist for this document
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM ${vectorTableName}
      WHERE document_id = $1
    `, documentId)
    
    const chunkCount = parseInt(countResult[0]?.count || 0)
    console.log(`📊 Found ${chunkCount} chunks to delete for document ${documentId}`)
    
    if (chunkCount === 0) {
      console.log(`ℹ️ No chunks found for document ${documentId}, nothing to delete`)
      return { success: true, deleted: 0 }
    }
    
    // Delete the chunks
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM ${vectorTableName}
      WHERE document_id = $1
    `, documentId)
    
    console.log(`✅ Successfully deleted ${result} chunks for document ${documentId}`)
    
    return { success: true, deleted: result }
  } catch (error) {
    console.error('Error deleting vectors:', error)
    
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      console.warn(`⚠️ Vector table does not exist for user ${userId} - this may be expected if no documents were processed`)
      // Don't throw error if table doesn't exist - just log and return success
      return { success: true, deleted: 0, warning: 'Vector table does not exist' }
    }
    
    throw new Error(`Failed to delete document vectors: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get count of vectors for a specific document
 * @param {string} userId - The client's user ID
 * @param {string} documentId - The document ID
 */
export const getDocumentVectorCount = async (userId, documentId) => {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string')
  }
  
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId: must be a non-empty string')
  }

  try {
    const vectorTableName = getClientVectorTableName(userId)
    
    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM ${vectorTableName}
      WHERE document_id = $1
    `, documentId)
    
    return parseInt(result[0]?.count || 0)
  } catch (error) {
    console.error('Error getting vector count:', error)
    
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      throw new Error(`Vector table does not exist for user ${userId}`)
    }
    
    throw new Error(`Failed to get document vector count: ${error.message || 'Unknown error'}`)
  }
}
