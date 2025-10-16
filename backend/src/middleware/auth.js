import jwt from 'jsonwebtoken'

export const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token.' })
      return
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired.' })
      return
    }
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Token verification failed.' })
  }
}