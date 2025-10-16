import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { createClientVectorTable } from '../services/clientVectorService.js'

const prisma = new PrismaClient()

const registerSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().min(10),
  company: z.string().min(2).optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['admin', 'client'])
})

export const register = async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body)
    const validatedData = registerSchema.parse(req.body)
    console.log('✅ Validation passed:', validatedData)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.fullName,
        role: 'CLIENT',
        status: 'PENDING',
        emailVerified: false,
        phone: validatedData.mobile,  // Map mobile from request to phone in DB
        company: validatedData.company
      }
    })

    // Create dedicated vector table for this client
    try {
      await createClientVectorTable(newUser.id)
      console.log(`✅ Vector table created for client ${newUser.id}`)
    } catch (vectorError) {
      // Log error but don't fail registration
      console.error('Warning: Failed to create vector table for client:', vectorError)
      // You might want to set a flag in the user record or create a notification
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      res.status(400).json({ error: 'Validation error', details: error.errors })
      return
    }
    console.error('❌ Registration error:', error)
    res.status(500).json({ error: 'Registration failed', message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check role
    const expectedRole = validatedData.role === 'admin' ? 'ADMIN' : 'CLIENT'
    if (user.role !== expectedRole) {
      res.status(403).json({ error: 'Access denied for this role' })
      return
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors })
      return
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const verifyToken = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true
      }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ error: 'Token verification failed' })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body

    // In a real implementation, you would verify the token
    // For now, we'll just update the user's email verification status
    const user = await prisma.user.findFirst({
      where: { email: 'user@example.com' } // This should be based on the token
    })

    if (!user) {
      res.status(404).json({ error: 'Invalid verification token' })
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    })

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({ error: 'Email verification failed' })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // In a real implementation, you would send a password reset email
    // For now, we'll just return a success message
    res.json({ message: 'Password reset instructions sent to your email' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Password reset failed' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    // In a real implementation, you would verify the token
    // For now, we'll just update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: 'user@example.com' }, // This should be based on the token
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Password reset error:', error)
    res.status(500).json({ error: 'Password reset failed' })
  }
}