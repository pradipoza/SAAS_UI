import express from 'express'
import { 
  getClientDashboard,
  getMessages,
  getClientAnalytics,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getContacts,
  getBotSettings,
  updateBotSettings,
  getNotifications,
  getAdminMessages,
  sendMessageToAdmin,
  getPayments,
  initiatePayment,
  verifyPayment,
  getHelp,
  createSupportTicket,
} from '../controllers/clientController.js'
import { auth } from '../middleware/auth.js'
import { requireClient } from '../middleware/roleCheck.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// All client routes require authentication and client role
router.use(auth)
router.use(requireClient)

// Dashboard
router.get('/dashboard', getClientDashboard)

// Messages
router.get('/messages', getMessages)

// Analytics
router.get('/analytics', getClientAnalytics)

// Documents
router.get('/documents', getDocuments)
router.post('/documents/upload', upload.single('file'), uploadDocument)
router.get('/documents/:documentId/download', downloadDocument)
router.delete('/documents/:documentId', deleteDocument)

// CRM
router.get('/contacts', getContacts)

// Bot Settings
router.get('/bot-settings', getBotSettings)
router.put('/bot-settings', updateBotSettings)

// Notifications
router.get('/notifications', getNotifications)

// Admin Messages
router.get('/admin-messages', getAdminMessages)
router.post('/admin-messages/send', sendMessageToAdmin)

// Payments
router.get('/payments', getPayments)
router.post('/payments/initiate', initiatePayment)
router.post('/payments/verify', verifyPayment)

// Help & Support
router.get('/help', getHelp)
router.post('/support-tickets', createSupportTicket)


export default router