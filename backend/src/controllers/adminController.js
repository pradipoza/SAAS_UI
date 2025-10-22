import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Admin Dashboard Controller
export const getDashboardStats = async (req, res) => {
  try {
    // Get total clients
    const totalClients = await prisma.user.count({
      where: { role: 'CLIENT' }
    })

    // Get total messages from all channel tables
    const [whatsappCount, facebookCount, instagramCount, websiteCount, tiktokCount] = await Promise.all([
      prisma.whatsAppMessage.count(),
      prisma.facebookMessage.count(),
      prisma.instagramMessage.count(),
      prisma.websiteMessage.count(),
      prisma.tikTokMessage.count()
    ])
    const totalMessages = whatsappCount + facebookCount + instagramCount + websiteCount + tiktokCount

    // Get total revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    })

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    })

    res.json({
      totalClients,
      totalMessages,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeSubscriptions
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}

// Admin Analytics Controller
export const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get message trends from all channel tables
    const [whatsappTrends, facebookTrends, instagramTrends, websiteTrends, tiktokTrends] = await Promise.all([
      prisma.whatsAppMessage.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.facebookMessage.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.instagramMessage.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.websiteMessage.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.tikTokMessage.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      })
    ])

    // Combine all message trends
    const allTrends = [...whatsappTrends, ...facebookTrends, ...instagramTrends, ...websiteTrends, ...tiktokTrends]
    const messageTrends = allTrends.reduce((acc, trend) => {
      const date = trend.created_at.toISOString().split('T')[0]
      const existing = acc.find(t => t.createdAt === date)
      if (existing) {
        existing._count.id += trend._count.id
      } else {
        acc.push({ createdAt: date, _count: { id: trend._count.id } })
      }
      return acc
    }, []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    // Get revenue trends
    const revenueTrends = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get user registration trends
    const userTrends = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    res.json({
      messageTrends,
      revenueTrends,
      userTrends
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}

// Admin Users Controller
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = 'CLIENT' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = { role: role }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastActiveAt: true,
          status: true
        }
      }),
      prisma.user.count({ where })
    ])

    // Get additional data for each user
    const usersWithData = await Promise.all(
      users.map(async (user) => {
        const [chatbot, subscription] = await Promise.all([
          prisma.chatbot.findFirst({ where: { userId: user.id } }),
          prisma.subscription.findFirst({
            where: { userId: user.id, status: 'ACTIVE' }
          })
        ])

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          company: user.company,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
          status: user.status,
          chatbotStatus: chatbot?.status || 'INACTIVE',
          subscriptionStatus: subscription?.status || 'INACTIVE',
          subscriptionEnd: subscription?.endDate
        }
      })
    )

    res.json({
      users: usersWithData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

// Admin Running Projects Controller
export const getRunningProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const projects = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        createdAt: true
      }
    })

    // Get additional data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const [chatbot, subscription, payments] = await Promise.all([
          prisma.chatbot.findFirst({ where: { userId: project.id } }),
          prisma.subscription.findFirst({
            where: { userId: project.id, status: 'ACTIVE' },
            include: { plan: true }
          }),
          prisma.payment.findMany({
            where: { userId: project.id, status: 'PAID' },
            select: { amount: true }
          })
        ])

        return {
          id: project.id,
          email: project.email,
          name: project.name,
          company: project.company,
          phone: project.phone,
          createdAt: project.createdAt,
          chatbotId: chatbot?.id,
          chatbotName: chatbot?.name,
          status: chatbot?.status,
          planName: subscription?.plan?.name,
          planPrice: subscription?.plan?.price,
          paidAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
          paymentStatus: payments.length > 0 ? 'PAID' : 'PENDING'
        }
      })
    )

    res.json({
      projects: projectsWithData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: projects.length
      }
    })
  } catch (error) {
    console.error('Running projects error:', error)
    res.status(500).json({ error: 'Failed to fetch running projects' })
  }
}

// Admin Clients Controller
export const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = { role: 'CLIENT' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    const clients = await prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        createdAt: true,
        status: true
      }
    })

    // Get additional data for each client
    const clientsWithData = await Promise.all(
      clients.map(async (client) => {
        const [chatbot, subscription, payments] = await Promise.all([
          prisma.chatbot.findFirst({ where: { userId: client.id } }),
          prisma.subscription.findFirst({
            where: { userId: client.id, status: 'ACTIVE' },
            include: { plan: true }
          }),
          prisma.payment.aggregate({
            where: { userId: client.id, status: 'PAID' },
            _sum: { amount: true }
          })
        ])

        // Count messages from all channel tables for this client
        const [whatsappCount, facebookCount, instagramCount, websiteCount, tiktokCount] = await Promise.all([
          prisma.whatsAppMessage.count({ where: { client_id: client.id } }),
          prisma.facebookMessage.count({ where: { client_id: client.id } }),
          prisma.instagramMessage.count({ where: { client_id: client.id } }),
          prisma.websiteMessage.count({ where: { client_id: client.id } }),
          prisma.tikTokMessage.count({ where: { client_id: client.id } })
        ])
        const conversations = whatsappCount + facebookCount + instagramCount + websiteCount + tiktokCount

        return {
          id: client.id,
          email: client.email,
          name: client.name,
          company: client.company,
          phone: client.phone,
          createdAt: client.createdAt,
          status: client.status,
          chatbotId: chatbot?.id,
          chatbotName: chatbot?.name,
          chatbotStatus: chatbot?.status,
          planType: subscription?.plan?.name,
          subscriptionStatus: subscription?.status,
          endDate: subscription?.endDate,
          totalMessages: conversations,
          totalPaid: payments._sum.amount || 0
        }
      })
    )

    res.json({
      clients: clientsWithData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: clients.length
      }
    })
  } catch (error) {
    console.error('Clients error:', error)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}

// Admin Payments Controller
export const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (status !== 'all') {
      where.status = status
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          },
          subscription: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ])

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Payments error:', error)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
}

// Admin System Settings Controller
export const getSystemSettings = async (req, res) => {
  try {
    // Fetch subscription and development plans (with fallback if model doesn't exist)
    let subscriptionPlans = []
    let developmentPlans = []

    try {
      subscriptionPlans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.warn('Could not fetch subscription plans:', error.message)
    }

    try {
      // Check if developmentPlan model exists
      if (prisma.developmentPlan) {
        developmentPlans = await prisma.developmentPlan.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        })
      }
    } catch (error) {
      console.warn('Could not fetch development plans:', error.message)
    }

    const settings = {
      systemName: 'SAAS Chatbot Platform',
      version: '1.0.0',
      maintenanceMode: false,
      maxUsers: 1000,
      maxMessagesPerDay: 10000,
      features: {
        emailNotifications: true,
        smsNotifications: false,
        analytics: true,
        customBranding: true
      },
      subscriptionPlans,
      developmentPlans
    }

    res.json(settings)
  } catch (error) {
    console.error('System settings error:', error)
    res.status(500).json({ error: 'Failed to fetch system settings' })
  }
}

// Admin Customer Service Controller
export const getCustomerService = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (status !== 'all') {
      where.status = status
    }

    const [tickets, total, openTickets, inProgressTickets, resolvedTickets, closedTickets] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        }
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } })
    ])

    res.json({
      tickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      totalConversations: total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Customer service error:', error)
    res.status(500).json({ error: 'Failed to fetch customer service data' })
  }
}

// Admin Send Message Controller
export const sendMessage = async (req, res) => {
  try {
    const { clientId, message, subject, priority = 'NORMAL' } = req.body
    const adminId = req.user.userId

    // Create message record
    const newMessage = await prisma.adminClientMessage.create({
      data: {
        senderId: adminId,
        receiverId: clientId,
        message,
        subject,
        priority
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        }
      }
    })

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: clientId,
        title: 'New Message from Admin',
        message: subject || 'You have a new message from admin',
        type: 'SUPPORT',
        priority: priority === 'URGENT' ? 'URGENT' : 'MEDIUM'
      }
    })

    res.json({ success: true, message: newMessage })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

// Admin Messaging Controllers
export const getAdminMessages = async (req, res) => {
  try {
    const adminId = req.user.userId
    const { page = 1, limit = 20, clientId } = req.query

    console.log('📥 Admin fetching messages:', {
      adminId,
      page,
      limit,
      clientId
    })

    const where = {
      OR: [
        { senderId: adminId },
        { receiverId: adminId }
      ]
    }

    if (clientId) {
      where.OR = [
        { senderId: adminId, receiverId: clientId },
        { senderId: clientId, receiverId: adminId }
      ]
    }

    const messages = await prisma.adminClientMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })

    const total = await prisma.adminClientMessage.count({ where })

    console.log('✅ Admin messages retrieved:', {
      count: messages.length,
      total,
      messageIds: messages.map(m => m.id)
    })

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params
    const adminId = req.user.userId

    const message = await prisma.adminClientMessage.updateMany({
      where: {
        id: messageId,
        receiverId: adminId
      },
      data: {
        isRead: true
      }
    })

    res.json({ success: true, updated: message.count })
  } catch (error) {
    console.error('Mark message as read error:', error)
    res.status(500).json({ error: 'Failed to mark message as read' })
  }
}

export const getUnreadMessageCount = async (req, res) => {
  try {
    const adminId = req.user.userId

    const unreadCount = await prisma.adminClientMessage.count({
      where: {
        receiverId: adminId,
        isRead: false
      }
    })

    res.json({ unreadCount })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

// Plan Management Controllers

// Create Subscription Plan
export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, description, price, billingCycle, features } = req.body

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: parseInt(price),
        billingCycle: billingCycle || 'monthly',
        features: features || {},
        isActive: true
      }
    })

    res.json({ success: true, plan })
  } catch (error) {
    console.error('Create subscription plan error:', error)
    res.status(500).json({ error: 'Failed to create subscription plan' })
  }
}

// Update Subscription Plan
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, billingCycle, features, isActive } = req.body

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseInt(price) }),
        ...(billingCycle && { billingCycle }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json({ success: true, plan })
  } catch (error) {
    console.error('Update subscription plan error:', error)
    res.status(500).json({ error: 'Failed to update subscription plan' })
  }
}

// Delete Subscription Plan
export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete by marking as inactive
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete subscription plan error:', error)
    res.status(500).json({ error: 'Failed to delete subscription plan' })
  }
}

// Create Development Plan
export const createDevelopmentPlan = async (req, res) => {
  try {
    if (!prisma.developmentPlan) {
      return res.status(503).json({ error: 'Development plans feature is not available. Please regenerate Prisma client.' })
    }

    const { name, description, price, features } = req.body

    const plan = await prisma.developmentPlan.create({
      data: {
        name,
        description,
        price: parseInt(price),
        features: features || {},
        isActive: true
      }
    })

    res.json({ success: true, plan })
  } catch (error) {
    console.error('Create development plan error:', error)
    res.status(500).json({ error: 'Failed to create development plan' })
  }
}

// Update Development Plan
export const updateDevelopmentPlan = async (req, res) => {
  try {
    if (!prisma.developmentPlan) {
      return res.status(503).json({ error: 'Development plans feature is not available. Please regenerate Prisma client.' })
    }

    const { id } = req.params
    const { name, description, price, features, isActive } = req.body

    const plan = await prisma.developmentPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseInt(price) }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json({ success: true, plan })
  } catch (error) {
    console.error('Update development plan error:', error)
    res.status(500).json({ error: 'Failed to update development plan' })
  }
}

// Delete Development Plan
export const deleteDevelopmentPlan = async (req, res) => {
  try {
    if (!prisma.developmentPlan) {
      return res.status(503).json({ error: 'Development plans feature is not available. Please regenerate Prisma client.' })
    }

    const { id } = req.params

    // Soft delete by marking as inactive
    await prisma.developmentPlan.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete development plan error:', error)
    res.status(500).json({ error: 'Failed to delete development plan' })
  }
}