import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { getClientVectorTableName } from './clientVectorService.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const prisma = new PrismaClient()

export const generateEmbedding = async (text, model = 'text-embedding-3-small') => {
  try {
    const response = await openai.embeddings.create({
      model: model,
      input: text
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    chunks.push(chunk)
    start = end - overlap
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
  try {
    const vectorTableName = getClientVectorTableName(userId)
    
    // Store vectors in the client's dedicated table
    for (let i = 0; i < chunks.length; i++) {
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
    }
    
    return { success: true, vectorCount: chunks.length }
  } catch (error) {
    console.error('Error storing vectors:', error)
    throw new Error('Failed to store document vectors')
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
    throw new Error('Failed to search similar vectors')
  }
}

/**
 * Delete all vectors for a specific document from client's table
 * @param {string} userId - The client's user ID
 * @param {string} documentId - The document ID to delete
 */
export const deleteDocumentVectors = async (userId, documentId) => {
  try {
    const vectorTableName = getClientVectorTableName(userId)
    
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM ${vectorTableName}
      WHERE document_id = $1
    `, documentId)
    
    return { success: true, deleted: result }
  } catch (error) {
    console.error('Error deleting vectors:', error)
    throw new Error('Failed to delete document vectors')
  }
}

/**
 * Get count of vectors for a specific document
 * @param {string} userId - The client's user ID
 * @param {string} documentId - The document ID
 */
export const getDocumentVectorCount = async (userId, documentId) => {
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
    throw new Error('Failed to get document vector count')
  }
}
