import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Creates a dedicated schema and vector table for a new client
 * Schema name: client_vectors
 * Table name: client_{userId}_chunks
 */
export const createClientVectorTable = async (userId) => {
  try {
    // Sanitize userId to create a valid table name
    const sanitizedUserId = userId.replace(/-/g, '_')
    const schemaName = 'client_vectors'
    const tableName = `client_${sanitizedUserId}_chunks`
    
    // Create schema if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE SCHEMA IF NOT EXISTS ${schemaName}
    `)
    
    console.log(`✅ Schema '${schemaName}' created or already exists`)
    
    // Create the vector table for this client in the schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    console.log(`✅ Vector table '${schemaName}.${tableName}' created successfully`)
    
    // Create index for faster similarity search
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx 
      ON ${schemaName}.${tableName} 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
    
    console.log(`✅ Vector index created for '${schemaName}.${tableName}'`)
    
    // Create index on document_id for faster document deletion
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS ${tableName}_document_id_idx 
      ON ${schemaName}.${tableName} (document_id)
    `)
    
    // Create index on metadata for faster chunk_index queries
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS ${tableName}_metadata_chunk_idx 
      ON ${schemaName}.${tableName} USING GIN ((metadata->'chunk_index'))
    `)
    
    console.log(`✅ Document ID index created for '${schemaName}.${tableName}'`)
    
    return {
      success: true,
      schemaName,
      tableName,
      fullTableName: `${schemaName}.${tableName}`
    }
  } catch (error) {
    console.error('Error creating client vector table:', error)
    throw new Error(`Failed to create vector table for client ${userId}: ${error.message}`)
  }
}

/**
 * Gets the full table name for a client's vector table
 */
export const getClientVectorTableName = (userId) => {
  const sanitizedUserId = userId.replace(/-/g, '_')
  return `client_vectors.client_${sanitizedUserId}_chunks`
}

/**
 * Deletes a client's vector table (use with caution!)
 */
export const deleteClientVectorTable = async (userId) => {
  try {
    const sanitizedUserId = userId.replace(/-/g, '_')
    const schemaName = 'client_vectors'
    const tableName = `client_${sanitizedUserId}_chunks`
    
    await prisma.$executeRawUnsafe(`
      DROP TABLE IF EXISTS ${schemaName}.${tableName} CASCADE
    `)
    
    console.log(`✅ Vector table '${schemaName}.${tableName}' deleted successfully`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting client vector table:', error)
    throw new Error(`Failed to delete vector table for client ${userId}: ${error.message}`)
  }
}

/**
 * Checks if a client's vector table exists
 */
export const clientVectorTableExists = async (userId) => {
  try {
    const sanitizedUserId = userId.replace(/-/g, '_')
    const schemaName = 'client_vectors'
    const tableName = `client_${sanitizedUserId}_chunks`
    
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_name = '${tableName}'
      )
    `)
    
    return result[0]?.exists || false
  } catch (error) {
    console.error('Error checking if client vector table exists:', error)
    return false
  }
}

/**
 * Lists all client vector tables in the schema
 */
export const listClientVectorTables = async () => {
  try {
    const schemaName = 'client_vectors'
    
    const result = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}'
      ORDER BY table_name
    `)
    
    return result.map(row => row.table_name)
  } catch (error) {
    console.error('Error listing client vector tables:', error)
    throw new Error('Failed to list client vector tables')
  }
}

/**
 * Gets statistics for a client's vector table
 */
export const getClientVectorStats = async (userId) => {
  try {
    const tableName = getClientVectorTableName(userId)
    
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT document_id) as total_documents,
        pg_size_pretty(pg_total_relation_size('${tableName}')) as table_size
      FROM ${tableName}
    `)
    
    return result[0]
  } catch (error) {
    console.error('Error getting client vector stats:', error)
    throw new Error(`Failed to get vector stats for client ${userId}`)
  }
}

