import { PrismaClient } from '@prisma/client'
import { generateEmbedding, chunkText, storeDocumentVectors, getDocumentVectorCount } from './vectorService.js'

const prisma = new PrismaClient()

export const processDocument = async (documentId, content, metadata = {}) => {
  try {
    // Get document to find the chatbot and user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        chatbot: {
          select: {
            userId: true,
            chunkSize: true,
            overlap: true
          }
        }
      }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const userId = document.chatbot.userId
    const chunkSize = document.chatbot.chunkSize || 1000
    const overlap = document.chatbot.overlap || 200

    // Update document status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }
    })

    // Chunk the content
    const chunks = chunkText(content, chunkSize, overlap)
    
    // Generate embeddings for each chunk
    const embeddings = []
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      embeddings.push(embedding)
    }

    // Store vectors in the client's dedicated vector table
    await storeDocumentVectors(userId, documentId, chunks, embeddings, {
      ...metadata,
      fileName: document.originalName,
      fileType: document.fileType,
      // chunk_index will be added automatically in storeDocumentVectors
    })

    // Get the actual vector count
    const vectorCount = await getDocumentVectorCount(userId, documentId)

    // Update document status to processed
    await prisma.document.update({
      where: { id: documentId },
      data: { 
        status: 'PROCESSED',
        vectorCount: vectorCount,
        updatedAt: new Date()
      }
    })

    return { success: true, vectorCount }
  } catch (error) {
    console.error('Error processing document:', error)
    
    // Update document status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' }
    })

    throw new Error('Failed to process document')
  }
}

export const extractTextFromPDF = async (fileBuffer) => {
  // This would need a PDF parsing library like pdf-parse
  // For now, return a placeholder
  return 'PDF content extraction not implemented yet'
}

export const extractTextFromDOC = async (fileBuffer) => {
  // This would need a DOC parsing library
  // For now, return a placeholder
  return 'DOC content extraction not implemented yet'
}

export const extractTextFromTXT = async (fileBuffer) => {
  return fileBuffer.toString('utf-8')
}

export const getDocumentContent = async (documentId) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    return document
  } catch (error) {
    console.error('Error getting document:', error)
    throw new Error('Failed to get document')
  }
}

export const deleteDocument = async (documentId) => {
  try {
    // Get document to find the user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        chatbot: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const userId = document.chatbot.userId

    // Import deleteDocumentVectors dynamically to avoid circular dependency
    const { deleteDocumentVectors } = await import('./vectorService.js')
    
    // Delete vectors from client's table
    await deleteDocumentVectors(userId, documentId)

    // Delete document record
    await prisma.document.delete({
      where: { id: documentId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    throw new Error('Failed to delete document')
  }
}
