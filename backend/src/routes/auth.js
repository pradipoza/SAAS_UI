import express from 'express'
import { 
  register, 
  login, 
  verifyToken, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/verify', auth, verifyToken)

export default router