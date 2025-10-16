import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('client_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request with token:', config.url)
    } else {
      console.warn('API Request without token:', config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('client_token')
      window.location.href = '/login'
    }
    // Log the error for debugging
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API service object with specific methods for components
const apiService = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('client_token')
    return !!token
  },

  // Generic methods
  get: (endpoint) => api.get(endpoint).then(response => response.data),
  post: (endpoint, data) => api.post(endpoint, data).then(response => response.data),
  put: (endpoint, data) => api.put(endpoint, data).then(response => response.data),
  delete: (endpoint) => api.delete(endpoint).then(response => response.data),
  patch: (endpoint, data) => api.patch(endpoint, data).then(response => response.data),

  // Specific API methods for different endpoints
  getDashboard: () => api.get('/api/client/dashboard').then(response => response.data),
  
  getMessages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/api/client/messages${queryString ? `?${queryString}` : ''}`).then(response => response.data)
  },
  
  getAnalytics: () => api.get('/api/client/analytics').then(response => response.data),
  
  getCRM: () => api.get('/api/client/contacts').then(response => response.data),
  
  getKnowledgeBase: () => api.get('/api/client/knowledge-base').then(response => response.data),
  
  getBotSettings: () => api.get('/api/client/bot-settings').then(response => response.data),
  
  getHelp: () => api.get('/api/client/help').then(response => response.data),
  
  getPayments: () => api.get('/api/client/payments').then(response => response.data),
  
  getDocuments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return api.get(`/api/client/documents${queryString ? `?${queryString}` : ''}`).then(response => response.data)
  },
  
  uploadDocument: (formData) => {
    const token = localStorage.getItem('client_token')
    return api.post('/api/client/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    }).then(response => response.data)
  },
  
  downloadDocument: (id) => api.get(`/api/client/documents/${id}/download`).then(response => response.data),
  
  deleteDocument: (id) => api.delete(`/api/client/documents/${id}`).then(response => response.data),
  
  updateDocument: (id, data) => api.put(`/api/client/documents/${id}`, data).then(response => response.data),
  
  // Authentication methods
  login: (credentials) => api.post('/api/auth/login', credentials).then(response => response.data),
  
  register: (userData) => api.post('/api/auth/register', userData).then(response => response.data),
  
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }).then(response => response.data),
  
  verifyEmail: (token) => api.post('/api/auth/verify-email', { token }).then(response => response.data),

  // Client Messaging methods
  getMessages: (params = {}) => api.get('/api/client/messages', { params }).then(response => response.data),
  
  sendMessage: (data) => api.post('/api/client/messages/send', data).then(response => response.data),
  
  markMessageAsRead: (messageId) => api.put(`/api/client/messages/${messageId}/read`).then(response => response.data),
  
  getUnreadMessageCount: () => api.get('/api/client/messages/unread-count').then(response => response.data)
}

export default apiService
