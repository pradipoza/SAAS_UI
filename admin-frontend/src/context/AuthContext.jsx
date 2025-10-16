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
    const token = localStorage.getItem('admin_token')
    console.log('AuthContext: Checking for token:', token)
    if (token) {
      // Verify token and get user data
      authService.verifyToken()
        .then(userData => {
          console.log('AuthContext: Token verified, user data:', userData)
          setUser(userData)
        })
        .catch((error) => {
          console.log('AuthContext: Token verification failed:', error)
          localStorage.removeItem('admin_token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      console.log('AuthContext: No token found, setting loading to false')
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    console.log('AuthContext: Starting login process')
    const response = await authService.login(email, password)
    console.log('AuthContext: Login response received:', response)
    localStorage.setItem('admin_token', response.token)
    setUser(response.user)
    console.log('AuthContext: User state updated:', response.user)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
