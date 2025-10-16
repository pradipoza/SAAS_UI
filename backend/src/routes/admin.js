import express from 'express'
import { 
  getDashboardStats,
  getAnalytics,
  getUsers,
  getRunningProjects,
  getClients,
  getPayments,
  getSystemSettings,
  getCustomerService,
  sendMessage
} from '../controllers/adminController.js'
import { auth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/roleCheck.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(auth)
router.use(requireAdmin)

// Dashboard
router.get('/dashboard', getDashboardStats)

// Analytics
router.get('/analytics', getAnalytics)

// Users
router.get('/users', getUsers)

// Running Projects
router.get('/running-projects', getRunningProjects)

// Clients
router.get('/clients', getClients)

// Payments
router.get('/payments', getPayments)

// System Settings
router.get('/system-settings', getSystemSettings)

// Customer Service
router.get('/customer-service', getCustomerService)
router.post('/customer-service/send', sendMessage)

export default router