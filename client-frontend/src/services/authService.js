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
    const token = localStorage.getItem('client_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    if (error.response?.status === 401) {
      localStorage.removeItem('client_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(email, password) {
    console.log('Client AuthService: Making login request to:', '/auth/login')
    console.log('Client AuthService: Request data:', { email, password, role: 'client' })
    const response = await api.post('/auth/login', { email, password, role: 'client' })
    console.log('Client AuthService: Login response:', response.data)
    return response.data
  },

  async register(userData) {
    console.log('Client AuthService: Making registration request to:', '/auth/register')
    console.log('Client AuthService: Request data:', userData)
    const response = await api.post('/auth/register', userData)
    console.log('Client AuthService: Registration response:', response.data)
    return response.data
  },

  async verifyToken() {
    const response = await api.get('/auth/verify')
    return response.data.user
  },

  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  }
}
