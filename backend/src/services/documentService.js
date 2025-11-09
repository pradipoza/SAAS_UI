// top-of-file imports
import fs from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { generateEmbedding, chunkText, storeDocumentVectors, getDocumentVectorCount } from './vectorService.js'

// Import pdfjs-dist for PDF text extraction
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const prisma = new PrismaClient()

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set up PDF.js worker for Node.js environment
// Convert path to file:// URL for Windows compatibility
const workerPath = join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href

/**
 * Extract text from file based on file type
 * @param {string} filePath - Path to the file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromFile = async (filePath, fileType) => {
  try {
    console.log(`📖 Extracting text from file: ${filePath}, type: ${fileType}`)
    
    // Read file buffer
    const fileBuffer = await fs.readFile(filePath)
    
    // Extract text based on file type
    if (fileType === 'text/plain' || fileType.includes('text')) {
      return extractTextFromTXT(fileBuffer)
    } else if (fileType === 'application/pdf') {
      return await extractTextFromPDF(fileBuffer)
    } else if (fileType === 'application/msword' || 
               fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractTextFromDOC(fileBuffer)
    } else {
      // Default: try to read as text
      console.warn(`⚠️ Unknown file type ${fileType}, attempting to read as text`)
      return extractTextFromTXT(fileBuffer)
    }
  } catch (error) {
    console.error('Error extracting text from file:', error)
    throw new Error(`Failed to extract text from file: ${error.message}`)
  }
}

/**
 * Extract text from PDF buffer using pdfjs-dist
 * @param {Buffer} fileBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromPDF = async (fileBuffer) => {
  try {
    console.log(`📄 Extracting text from PDF using pdfjs-dist (size: ${fileBuffer.length} bytes)`)

    // Convert Buffer to Uint8Array for pdfjs-dist
    const uint8Array = new Uint8Array(fileBuffer)

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdfDocument = await loadingTask.promise

    console.log(`📖 PDF loaded: ${pdfDocument.numPages} pages`)

    let fullText = ''
    const numPages = pdfDocument.numPages

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
      
      fullText += pageText + '\n'
      
      console.log(`  ✓ Page ${pageNum}/${numPages} extracted`)
    }

    // Clean up
    await pdfDocument.destroy()

    if (!fullText || fullText.trim().length === 0) {
      console.warn('⚠️ PDF contains no extractable text (may be image-based/scanned PDF)')
      throw new Error('PDF contains no extractable text. The PDF may be image-based or scanned. OCR processing would be required.')
    }

    console.log(`✅ Extracted ${fullText.length} characters from PDF (${numPages} pages)`)
    return fullText.trim()
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    
    // Provide more specific error messages
    const errorMsg = error?.message?.toLowerCase() || ''
    
    if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
      throw new Error('PDF is password-protected. Please provide an unencrypted PDF.')
    }
    
    if (errorMsg.includes('invalid') || errorMsg.includes('corrupted')) {
      throw new Error('Invalid PDF file format. The file may be corrupted.')
    }
    
    throw new Error(`Failed to extract text from PDF: ${error?.message || 'Unknown error'}`)
  }
}


/**
 * Process a document: extract text, chunk it, generate embeddings, and store vectors
 * @param {string} documentId - The document ID
 * @param {string} filePath - Path to the uploaded file
 * @param {string} fileType - MIME type of the file
 */
export const processDocument = async (documentId, filePath, fileType) => {
  try {
    console.log(`📄 Processing document ${documentId} from ${filePath}`)
    
    // Get document to find the client_id
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (!document.client_id) {
      throw new Error('Document missing client_id')
    }

    const userId = document.client_id

    // Get chatbot settings for chunkSize and overlap
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId: userId },
      select: {
        chunkSize: true,
        overlap: true
      }
    })

    const chunkSize = chatbot?.chunkSize || 1000
    const overlap = chatbot?.overlap || 200

    // Update document status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }
    })

    // Extract text from file
    const content = await extractTextFromFile(filePath, fileType)
    
    if (!content || content.trim().length === 0) {
      throw new Error('File is empty or could not extract text content')
    }

    console.log(`✅ Extracted ${content.length} characters from file`)

    // Chunk the content
    console.log(`🔪 Chunking with size=${chunkSize}, overlap=${overlap}`)
    const chunks = chunkText(content, chunkSize, overlap)
    console.log(`✅ Created ${chunks.length} chunks`)
    
    // Generate embeddings for each chunk with per-chunk error recovery
    console.log(`🤖 Generating embeddings for ${chunks.length} chunks...`)
    const embeddings = []
    const failedEmbeddings = []
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i])
        embeddings.push(embedding)
      } catch (embeddingError) {
        console.error(`Error generating embedding for chunk ${i}:`, embeddingError)
        failedEmbeddings.push({ index: i, error: embeddingError.message })
        embeddings.push(null) // Mark as failed
      }
    }

    // Filter out failed embeddings and corresponding chunks
    const validChunks = []
    const validEmbeddings = []
    
    for (let i = 0; i < chunks.length; i++) {
      if (embeddings[i] !== null) {
        validChunks.push(chunks[i])
        validEmbeddings.push(embeddings[i])
      }
    }

    if (validChunks.length === 0) {
      throw new Error('Failed to generate embeddings for any chunks')
    }

    if (failedEmbeddings.length > 0) {
      console.warn(`⚠️ Warning: ${failedEmbeddings.length} out of ${chunks.length} chunks failed to generate embeddings`)
    }

    console.log(`✅ Generated ${validEmbeddings.length} valid embeddings`)

    // Store vectors in the client's dedicated vector table
    console.log(`💾 Storing ${validEmbeddings.length} vectors...`)
    await storeDocumentVectors(userId, documentId, validChunks, validEmbeddings, {
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

    console.log(`✅ Document processing complete. Stored ${vectorCount} vectors.`)

    // Clean up temporary file
    try {
      await fs.unlink(filePath)
      console.log(`🗑️ Deleted temporary file: ${filePath}`)
    } catch (unlinkError) {
      console.warn(`⚠️ Warning: Failed to delete temporary file ${filePath}:`, unlinkError.message)
      // Don't fail the whole operation if file cleanup fails
    }

    return { success: true, vectorCount, failedEmbeddings: failedEmbeddings.length > 0 ? failedEmbeddings : undefined }
  } catch (error) {
    console.error('Error processing document:', error)
    
    // Update document status to failed
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' }
      })
    } catch (updateError) {
      console.error('Failed to update document status to FAILED:', updateError)
    }

    // Try to clean up file even on error
    try {
      if (filePath) {
        await fs.unlink(filePath)
        console.log(`🗑️ Cleaned up file after error: ${filePath}`)
      }
    } catch (unlinkError) {
      // Ignore cleanup errors
    }

    throw new Error(`Failed to process document: ${error.message || 'Unknown error'}`)
  }
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
    // Get document to find the user using client_id
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (!document.client_id) {
      throw new Error('Document missing client_id')
    }

    const userId = document.client_id

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
    throw new Error(`Failed to delete document: ${error.message || 'Unknown error'}`)
  }
}
