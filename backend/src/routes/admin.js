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
  sendMessage,
  getAdminMessages,
  markMessageAsRead,
  getUnreadMessageCount,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createDevelopmentPlan,
  updateDevelopmentPlan,
  deleteDevelopmentPlan
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

// Plan Management
router.post('/subscription-plans', createSubscriptionPlan)
router.put('/subscription-plans/:id', updateSubscriptionPlan)
router.delete('/subscription-plans/:id', deleteSubscriptionPlan)

router.post('/development-plans', createDevelopmentPlan)
router.put('/development-plans/:id', updateDevelopmentPlan)
router.delete('/development-plans/:id', deleteDevelopmentPlan)

// Customer Service
router.get('/customer-service', getCustomerService)
router.post('/customer-service/send', sendMessage)

// Admin Messaging
router.get('/messages', getAdminMessages)
router.post('/messages/send', sendMessage)
router.put('/messages/:messageId/read', markMessageAsRead)
router.get('/messages/unread-count', getUnreadMessageCount)

export default router