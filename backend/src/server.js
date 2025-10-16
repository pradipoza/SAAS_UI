import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Import routes
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import clientRoutes from './routes/client.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: [
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
    process.env.CLIENT_FRONTEND_URL || 'http://localhost:3002'
  ],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'saas-chatbot-backend',
    port: PORT,
    timestamp: new Date().toISOString()
  })
})


// API routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/client', clientRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 Admin Frontend: ${process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`🔗 Client Frontend: ${process.env.CLIENT_FRONTEND_URL || 'http://localhost:3002'}`)
})

export default app