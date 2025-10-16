import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('client_token')
    if (token) {
      // Verify token and get user data
      authService.verifyToken()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('client_token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    console.log('Client AuthContext: Starting login process')
    const response = await authService.login(email, password)
    console.log('Client AuthContext: Login response received:', response)
    localStorage.setItem('client_token', response.token)
    setUser(response.user)
    console.log('Client AuthContext: User state updated:', response.user)
  }

  const register = async (userData) => {
    const response = await authService.register(userData)
    // Optionally save token and user data after registration
    if (response.token) {
      localStorage.setItem('client_token', response.token)
      setUser(response.user)
    }
    return response
  }

  const logout = () => {
    localStorage.removeItem('client_token')
    setUser(null)
  }

  const verifyEmail = async (token) => {
    await authService.verifyEmail(token)
  }

  const forgotPassword = async (email) => {
    await authService.forgotPassword(email)
  }

  const resetPassword = async (token, password) => {
    await authService.resetPassword(token, password)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
