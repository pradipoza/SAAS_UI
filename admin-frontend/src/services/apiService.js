import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log API requests
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      params: config.params
    })
    
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    // Log successful API responses
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`)
    console.log('Response data:', response.data)
    console.log('Response status:', response.status)
    return response
  },
  (error) => {
    // Log API errors
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - redirecting to login')
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Admin Messaging API methods
export const adminMessaging = {
  // Get all messages for admin
  getMessages: (params = {}) => api.get('/admin/messages', { params }),
  
  // Send message to client
  sendMessage: (data) => api.post('/admin/messages/send', data),
  
  // Mark message as read
  markAsRead: (messageId) => api.put(`/admin/messages/${messageId}/read`),
  
  // Get unread message count
  getUnreadCount: () => api.get('/admin/messages/unread-count')
}

export default api
