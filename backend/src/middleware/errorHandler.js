export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error(err)

  // Vector-specific errors
  if (err.message?.includes('vector table') || 
      err.message?.includes('does not exist') || 
      err.message?.includes('relation')) {
    return res.status(500).json({
      success: false,
      error: 'Vector database not initialized',
      detail: err.message,
      code: 'VECTOR_DB_ERROR'
    })
  }

  // OpenAI API key errors
  if (err.message?.includes('OPENAI_API_KEY') || 
      err.message?.includes('API key') ||
      err.message?.includes('embedding')) {
    return res.status(500).json({
      success: false,
      error: 'Embedding service not configured',
      detail: err.message,
      code: 'EMBEDDING_CONFIG_ERROR'
    })
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  })
}