import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Client Dashboard Controller
export const getClientDashboard = async (req, res) => {
  try {
    const userId = req.user.userId

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.json({
        stats: {
          totalMessages: 0,
          activeChats: 0,
          documents: 0,
          customers: 0,
          monthlyGrowth: 0,
          averageResponseTime: 0,
          subscriptionStatus: 'INACTIVE'
        },
        recentActivity: []
      })
    }

    // Get total messages from all channel tables
    const [whatsappCount, facebookCount, instagramCount, websiteCount, tiktokCount] = await Promise.all([
      prisma.whatsAppMessage.count({ where: { client_id: userId } }),
      prisma.facebookMessage.count({ where: { client_id: userId } }),
      prisma.instagramMessage.count({ where: { client_id: userId } }),
      prisma.websiteMessage.count({ where: { client_id: userId } }),
      prisma.tikTokMessage.count({ where: { client_id: userId } })
    ])
    const totalMessages = whatsappCount + facebookCount + instagramCount + websiteCount + tiktokCount

    // Get active chats - count unique customers across all channels
    const [whatsappCustomers, facebookCustomers, instagramCustomers, websiteCustomers, tiktokCustomers] = await Promise.all([
      prisma.whatsAppMessage.findMany({ 
        where: { client_id: userId },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.facebookMessage.findMany({ 
        where: { client_id: userId },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.instagramMessage.findMany({ 
        where: { client_id: userId },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.websiteMessage.findMany({ 
        where: { client_id: userId },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.tikTokMessage.findMany({ 
        where: { client_id: userId },
        select: { customer_id: true },
        distinct: ['customer_id']
      })
    ])
    
    // Combine all unique customer IDs
    const allCustomerIds = new Set([
      ...whatsappCustomers.map(c => c.customer_id),
      ...facebookCustomers.map(c => c.customer_id),
      ...instagramCustomers.map(c => c.customer_id),
      ...websiteCustomers.map(c => c.customer_id),
      ...tiktokCustomers.map(c => c.customer_id)
    ].filter(Boolean))
    const activeChats = allCustomerIds.size

    // Get documents count
    const documents = await prisma.document.count({
      where: { client_id: userId }
    })

    // Get customers count - same as active chats for now
    const customers = activeChats

    // Get subscription info
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true }
    })

    // Get recent activity from all channel tables
    const [recentWhatsapp, recentFacebook, recentInstagram, recentWebsite, recentTiktok] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: { client_id: userId },
        orderBy: { created_at: 'desc' },
        take: 1
      }),
      prisma.facebookMessage.findMany({
        where: { client_id: userId },
        orderBy: { created_at: 'desc' },
        take: 1
      }),
      prisma.instagramMessage.findMany({
        where: { client_id: userId },
        orderBy: { created_at: 'desc' },
        take: 1
      }),
      prisma.websiteMessage.findMany({
        where: { client_id: userId },
        orderBy: { created_at: 'desc' },
        take: 1
      }),
      prisma.tikTokMessage.findMany({
        where: { client_id: userId },
        orderBy: { created_at: 'desc' },
        take: 1
      })
    ])
    
    // Combine and sort recent activity
    const allRecentMessages = [
      ...recentWhatsapp.map(msg => ({ ...msg, channel: 'WhatsApp' })),
      ...recentFacebook.map(msg => ({ ...msg, channel: 'Facebook' })),
      ...recentInstagram.map(msg => ({ ...msg, channel: 'Instagram' })),
      ...recentWebsite.map(msg => ({ ...msg, channel: 'Website' })),
      ...recentTiktok.map(msg => ({ ...msg, channel: 'TikTok' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

    res.json({
      stats: {
        totalMessages,
        activeChats,
        documents,
        customers,
        monthlyGrowth: 15, // This would be calculated
        averageResponseTime: 2.5, // This would be calculated
        subscriptionStatus: subscription?.status || 'INACTIVE'
      },
      recentActivity: allRecentMessages.map(activity => ({
        description: `New message from customer ${activity.customer_id} via ${activity.channel}`,
        timestamp: activity.created_at
      }))
    })
  } catch (error) {
    console.error('Client dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
}


// Client Messages Controller
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId
    const { channel = 'all', status = 'all', search = '' } = req.query


    // Determine which channel tables to query
    let channelTables = []
    if (channel === 'all') {
      channelTables = [
        { name: 'whatsapp', model: prisma.whatsAppMessage },
        { name: 'facebook', model: prisma.facebookMessage },
        { name: 'instagram', model: prisma.instagramMessage },
        { name: 'website', model: prisma.websiteMessage },
        { name: 'tiktok', model: prisma.tikTokMessage }
      ]
    } else {
      const channelMapping = {
        'web': { name: 'website', model: prisma.websiteMessage },
        'whatsapp': { name: 'whatsapp', model: prisma.whatsAppMessage },
        'facebook': { name: 'facebook', model: prisma.facebookMessage },
        'instagram': { name: 'instagram', model: prisma.instagramMessage },
        'tiktok': { name: 'tiktok', model: prisma.tikTokMessage }
      }
      const mappedChannel = channelMapping[channel]
      if (mappedChannel) {
        channelTables = [mappedChannel]
      }
    }

    // Get messages from selected channel tables
    const allMessages = []
    for (const channelTable of channelTables) {
      try {
        const whereClause = { client_id: userId }
        
        // Add search filter if provided
        if (search) {
          whereClause.message = {
            path: [],
            string_contains: search
          }
        }

        const messages = await channelTable.model.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' }
        })
        
        allMessages.push(...messages.map(msg => ({
          ...msg,
          channel: channelTable.name
        })))
      } catch (error) {
        console.error(`Error querying ${channelTable.name} messages:`, error)
        throw error
      }
    }

    // Group messages by session_id to create conversations
    const conversationsMap = new Map()
    allMessages.forEach(msg => {
      const sessionId = msg.session_id
      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, {
          id: sessionId,
          sessionId: sessionId,
          customerId: msg.customer_id,
          customerName: msg.customer_id ? `Customer ${msg.customer_id.substring(0, 8)}` : 'Anonymous',
          channel: msg.channel,
          messages: []
        })
      }
      conversationsMap.get(sessionId).messages.push(msg)
    })

    // Helper function to parse message content
    const parseMessageContent = (message) => {
      if (typeof message === 'string') {
        try {
          return JSON.parse(message)
        } catch (e) {
          return { type: 'human', content: message }
        }
      }
      return message
    }

    // Helper function to extract text content from message
    const getMessageText = (messageObj) => {
      if (typeof messageObj === 'string') return messageObj
      if (messageObj.content) return messageObj.content
      return JSON.stringify(messageObj)
    }

    // Convert to array and sort by last message time
    const conversations = Array.from(conversationsMap.values())
      .map(conv => {
        // Sort messages in the conversation by created_at ascending (oldest first)
        conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        
        const lastMessageObj = parseMessageContent(conv.messages[conv.messages.length - 1]?.message)
        const lastMessageText = getMessageText(lastMessageObj)
        
        return {
          ...conv,
          lastMessage: lastMessageText,
          lastMessageTime: conv.messages[conv.messages.length - 1]?.created_at || new Date(),
          status: 'active' // All conversations are considered active
        }
      })
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))

    const selectedConversation = conversations[0] || null

    res.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        sessionId: conv.sessionId,
        customerId: conv.customerId,
        customerName: conv.customerName,
        channel: conv.channel,
        lastMessage: conv.lastMessage.length > 50 ? conv.lastMessage.substring(0, 50) + '...' : conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        status: conv.status
      })),
      selectedConversation: selectedConversation ? {
        id: selectedConversation.id,
        sessionId: selectedConversation.sessionId,
        customerId: selectedConversation.customerId,
        customerName: selectedConversation.customerName,
        channel: selectedConversation.channel,
        messages: selectedConversation.messages.map(msg => {
          const messageObj = parseMessageContent(msg.message)
          return {
            id: msg.id,
            content: getMessageText(messageObj),
            type: messageObj.type || 'human', // 'human' or 'ai'
            sender: messageObj.type === 'ai' ? 'bot' : 'customer',
            timestamp: msg.created_at,
            metadata: messageObj.additional_kwargs || {}
          }
        })
      } : null
    })
  } catch (error) {
    console.error('Messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

// Client Analytics Controller
export const getClientAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId
    const { period = '7d' } = req.query

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.json({
        totalMessages: 0,
        activeUsers: 0,
        avgResponseTime: 0,
        satisfactionRate: 0,
        messageTrends: [],
        channelDistribution: [],
        conversationAnalytics: [],
        responseTimeTrends: []
      })
    }

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
          client_id: userId,
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.facebookMessage.groupBy({
        by: ['created_at'],
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.instagramMessage.groupBy({
        by: ['created_at'],
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.websiteMessage.groupBy({
        by: ['created_at'],
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { created_at: 'asc' }
      }),
      prisma.tikTokMessage.groupBy({
        by: ['created_at'],
        where: {
          client_id: userId,
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

    // Get channel distribution
    const channelDistribution = [
      { channel: 'WHATSAPP', _count: { id: whatsappTrends.reduce((sum, t) => sum + t._count.id, 0) } },
      { channel: 'FACEBOOK', _count: { id: facebookTrends.reduce((sum, t) => sum + t._count.id, 0) } },
      { channel: 'INSTAGRAM', _count: { id: instagramTrends.reduce((sum, t) => sum + t._count.id, 0) } },
      { channel: 'WEBSITE', _count: { id: websiteTrends.reduce((sum, t) => sum + t._count.id, 0) } },
      { channel: 'TIKTOK', _count: { id: tiktokTrends.reduce((sum, t) => sum + t._count.id, 0) } }
    ]

    // Get conversation analytics (all conversations are active)
    const conversationAnalytics = [
      { status: 'ACTIVE', _count: { id: messageTrends.reduce((sum, trend) => sum + trend._count.id, 0) } }
    ]

    // Get active users count - unique customers across all channels
    const [whatsappCustomers, facebookCustomers, instagramCustomers, websiteCustomers, tiktokCustomers] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.facebookMessage.findMany({
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.instagramMessage.findMany({
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.websiteMessage.findMany({
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        select: { customer_id: true },
        distinct: ['customer_id']
      }),
      prisma.tikTokMessage.findMany({
        where: {
          client_id: userId,
          created_at: { gte: startDate }
        },
        select: { customer_id: true },
        distinct: ['customer_id']
      })
    ])

    const allCustomerIds = new Set([
      ...whatsappCustomers.map(c => c.customer_id),
      ...facebookCustomers.map(c => c.customer_id),
      ...instagramCustomers.map(c => c.customer_id),
      ...websiteCustomers.map(c => c.customer_id),
      ...tiktokCustomers.map(c => c.customer_id)
    ].filter(Boolean))
    const activeUsers = allCustomerIds.size

    res.json({
      totalMessages: messageTrends.reduce((sum, trend) => sum + trend._count.id, 0),
      activeUsers,
      avgResponseTime: 2.5, // This would be calculated from actual data
      satisfactionRate: 85, // This would be calculated
      messageTrends,
      channelDistribution,
      conversationAnalytics,
      responseTimeTrends: [] // This would be calculated from actual data
    })
  } catch (error) {
    console.error('Client analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}

// Client Documents Controller
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.userId
    const { search = '', status = 'all', type = 'all' } = req.query

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.json({
        documents: [],
        stats: {
          totalDocuments: 0,
          processedDocuments: 0,
          processingDocuments: 0,
          totalSize: 0
        },
        pagination: {
          total: 0,
          page: 1,
          limit: 10
        }
      })
    }

    const where = { client_id: userId }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (type !== 'all') {
      where.fileType = type
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.count({ where })
    ])

    const stats = {
      totalDocuments: await prisma.document.count({ where: { client_id: userId } }),
      processedDocuments: await prisma.document.count({ 
        where: { client_id: userId, status: 'PROCESSED' } 
      }),
      processingDocuments: await prisma.document.count({ 
        where: { client_id: userId, status: 'PROCESSING' } 
      }),
      totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
    }

    res.json({
      documents,
      stats,
      pagination: {
        total,
        page: 1,
        limit: 10
      }
    })
  } catch (error) {
    console.error('Documents error:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
}

// Client Upload Document Controller
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.userId
    const { description } = req.body

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' })
    }

    // Extract file information from multer
    const { filename, originalname, mimetype, size, path } = req.file

    const document = await prisma.document.create({
      data: {
        client_id: userId,
        filename: filename,
        originalName: originalname,
        fileType: mimetype,
        fileSize: size,
        description: description || null,
        status: 'PROCESSING'
      }
    })

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        description: document.description,
        status: document.status,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('Upload document error:', error)
    res.status(500).json({ error: 'Failed to upload document' })
  }
}

// Client Download Document Controller
export const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params
    const userId = req.user.userId

    // Check if document belongs to user
    const document = await prisma.document.findFirst({
      where: { id: documentId, client_id: userId }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // For now, we'll return the document info
    // In a real implementation, you would serve the actual file
    res.json({
      message: 'Document download initiated',
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize
      }
    })
  } catch (error) {
    console.error('Download document error:', error)
    res.status(500).json({ error: 'Failed to download document' })
  }
}

// Client Delete Document Controller
export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params
    const userId = req.user.userId

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' })
    }

    // Check if document belongs to user
    const document = await prisma.document.findFirst({
      where: { id: documentId, client_id: userId }
    })

    if (!document) {
      res.status(404).json({ error: 'Document not found' })
      return
    }

    await prisma.document.delete({
      where: { id: documentId }
    })

    res.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete document error:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
}

// Client CRM Controller
export const getContacts = async (req, res) => {
  try {
    const userId = req.user.userId
    const { search = '', status = 'all', source = 'all' } = req.query

    // Get client's chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId }
    })

    if (!chatbot) {
      return res.json({
        customers: [],
        stats: {
          totalCustomers: 0,
          activeCustomers: 0,
          newCustomers: 0,
          totalValue: 0
        },
        pagination: {
          total: 0,
          page: 1,
          limit: 10
        }
      })
    }

    const where = { 
      conversations: {
        some: {
          chatbotId: chatbot.id
        }
      }
    }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (source !== 'all') {
      where.source = source
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    const stats = {
      totalCustomers: await prisma.customer.count({ 
        where: { 
          conversations: {
            some: {
              chatbotId: chatbot.id
            }
          }
        } 
      }),
      activeCustomers: await prisma.customer.count({ 
        where: { 
          conversations: {
            some: {
              chatbotId: chatbot.id
            }
          },
          status: 'ACTIVE' 
        } 
      }),
      newCustomers: await prisma.customer.count({ 
        where: { 
          conversations: {
            some: {
              chatbotId: chatbot.id
            }
          },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      }),
      totalValue: 0 // This would be calculated from actual data
    }

    res.json({
      customers,
      stats,
      pagination: {
        total,
        page: 1,
        limit: 10
      }
    })
  } catch (error) {
    console.error('CRM error:', error)
    res.status(500).json({ error: 'Failed to fetch CRM data' })
  }
}

// Client Bot Settings Controller
export const getBotSettings = async (req, res) => {
  try {
    const userId = req.user.userId

    const chatbot = await prisma.chatbot.findFirst({
      where: { userId },
      include: {
        channels: true
      }
    })

    // Default settings
    const defaultSettings = {
      general: {
        name: 'My Chatbot',
        description: 'AI-powered customer support chatbot',
        language: 'en',
        timezone: 'UTC'
      },
      channels: {
        web: { enabled: true, widgetColor: '#3B82F6' },
        facebook: { enabled: false, pageId: '' },
        whatsapp: { enabled: true, phoneNumber: '' },
        instagram: { enabled: false, accountId: '' },
        tiktok: { enabled: false, accountId: '' }
      },
      rag: {
        enabled: true,
        model: 'text-embedding-3-small',
        chunkSize: 1000,
        chunkOverlap: 200,
        dimensions: 1536
      }
    }

    if (chatbot) {
      // Update general settings
      defaultSettings.general.name = chatbot.name
      defaultSettings.general.description = chatbot.description

      // Update channel settings from database
      const channelMapping = {
        'WEBSITE': 'web',
        'WHATSAPP': 'whatsapp',
        'FACEBOOK': 'facebook',
        'INSTAGRAM': 'instagram',
        'TIKTOK': 'tiktok'
      }

      chatbot.channels.forEach(channel => {
        const channelKey = channelMapping[channel.channel]
        if (channelKey && defaultSettings.channels[channelKey]) {
          defaultSettings.channels[channelKey] = {
            ...defaultSettings.channels[channelKey],
            enabled: channel.enabled,
            ...(channel.credentials || {})
          }
        }
      })
    }

    res.json({ settings: defaultSettings })
  } catch (error) {
    console.error('Bot settings error:', error)
    res.status(500).json({ error: 'Failed to fetch bot settings' })
  }
}

// Client Update Bot Settings Controller
export const updateBotSettings = async (req, res) => {
  try {
    console.log('updateBotSettings called with:', { userId: req.user?.userId, settings: req.body })
    const userId = req.user.userId
    const { settings } = req.body

    if (!settings) {
      return res.status(400).json({ error: 'Settings data is required' })
    }

    // Get or create chatbot
    console.log('Creating/updating chatbot for user:', userId)
    const chatbot = await prisma.chatbot.upsert({
      where: { userId },
      update: {
        name: settings.general.name,
        description: settings.general.description
      },
      create: {
        userId,
        name: settings.general.name,
        description: settings.general.description,
        status: 'ACTIVE'
      }
    })
    console.log('Chatbot created/updated:', chatbot.id)

    // Update channel settings
    if (settings.channels) {
      console.log('Updating channel settings:', settings.channels)
      const channelMapping = {
        'web': 'WEBSITE',
        'whatsapp': 'WHATSAPP',
        'facebook': 'FACEBOOK',
        'instagram': 'INSTAGRAM',
        'tiktok': 'TIKTOK'
      }

      for (const [channelKey, channelConfig] of Object.entries(settings.channels)) {
        const channelType = channelMapping[channelKey]
        if (channelType && channelConfig) {
          console.log(`Updating channel ${channelKey} (${channelType}) with config:`, channelConfig)
          try {
            // First, try to find existing channel
            const existingChannel = await prisma.channel.findFirst({
              where: {
                chatbotId: chatbot.id,
                channel: channelType
              }
            })

            if (existingChannel) {
              // Update existing channel
              await prisma.channel.update({
                where: { id: existingChannel.id },
                data: {
                  enabled: channelConfig.enabled || false,
                  credentials: channelConfig
                }
              })
              console.log(`Channel ${channelKey} updated successfully`)
            } else {
              // Create new channel
              await prisma.channel.create({
                data: {
                  chatbotId: chatbot.id,
                  channel: channelType,
                  enabled: channelConfig.enabled || false,
                  credentials: channelConfig
                }
              })
              console.log(`Channel ${channelKey} created successfully`)
            }
          } catch (channelError) {
            console.error(`Error updating channel ${channelKey}:`, channelError)
            throw channelError
          }
        }
      }
    }

    res.json({ message: 'Bot settings updated successfully' })
  } catch (error) {
    console.error('Update bot settings error:', error)
    res.status(500).json({ error: 'Failed to update bot settings' })
  }
}

// Client Notifications Controller
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({ notifications })
  } catch (error) {
    console.error('Notifications error:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

// Client Admin Messages Controller
export const getAdminMessages = async (req, res) => {
  try {
    const userId = req.user.userId

    const messages = await prisma.adminClientMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ messages })
  } catch (error) {
    console.error('Admin messages error:', error)
    res.status(500).json({ error: 'Failed to fetch admin messages' })
  }
}


// Client Payments Controller
export const getPayments = async (req, res) => {
  try {
    const userId = req.user.userId

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true }
    })

    const paymentHistory = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    res.json({
      subscription,
      paymentHistory,
      invoices: [] // This would be implemented when invoice model is added
    })
  } catch (error) {
    console.error('Payments error:', error)
    res.status(500).json({ error: 'Failed to fetch payment data' })
  }
}

// Client Initiate Payment Controller
export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user.userId
    const { planId, paymentMethod = 'KHALTI' } = req.body

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' })
      return
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: plan.price,
        method: paymentMethod,
        status: 'PENDING'
      }
    })

    res.json({
      message: 'Payment initiated',
      paymentId: payment.id,
      amount: payment.amount,
      paymentMethod
    })
  } catch (error) {
    console.error('Initiate payment error:', error)
    res.status(500).json({ error: 'Failed to initiate payment' })
  }
}

// Client Verify Payment Controller
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, paymentData } = req.body

    // This would verify with the payment gateway
    // For now, we'll just mark as paid
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        transactionId: paymentData.transactionId,
        paidAt: new Date()
      }
    })

    // Create subscription (this would need planId from the payment)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // For now, we'll create a basic subscription
    // In a real implementation, you'd need to store planId in the payment
    await prisma.subscription.create({
      data: {
        userId: payment.userId,
        planId: 'default-plan-id', // This should come from the payment
        startDate,
        endDate,
        status: 'ACTIVE'
      }
    })

    res.json({
      message: 'Payment verified successfully',
      payment
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    res.status(500).json({ error: 'Failed to verify payment' })
  }
}

// Client Help Controller - combines notifications and support tickets
export const getHelp = async (req, res) => {
  try {
    const userId = req.user.userId

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get support tickets
    const supportTickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({
      notifications,
      supportTickets
    })
  } catch (error) {
    console.error('Help error:', error)
    res.status(500).json({ error: 'Failed to fetch help data' })
  }
}

// Client Messaging Controllers
export const getClientMessages = async (req, res) => {
  try {
    const clientId = req.user.userId
    const { page = 1, limit = 20 } = req.query

    const messages = await prisma.adminClientMessage.findMany({
      where: {
        OR: [
          { senderId: clientId },
          { receiverId: clientId }
        ]
      },
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

    const total = await prisma.adminClientMessage.count({
      where: {
        OR: [
          { senderId: clientId },
          { receiverId: clientId }
        ]
      }
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
    console.error('Get client messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

export const sendMessageToAdmin = async (req, res) => {
  try {
    const { message, subject, priority = 'NORMAL' } = req.body
    const clientId = req.user.userId

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    // Create message record
    const newMessage = await prisma.adminClientMessage.create({
      data: {
        senderId: clientId,
        receiverId: admin.id,
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
            role: true
          }
        }
      }
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'New Message from Client',
        message: subject || 'You have a new message from a client',
        type: 'SUPPORT',
        priority: priority === 'URGENT' ? 'URGENT' : 'MEDIUM'
      }
    })

    res.json({ success: true, message: newMessage })
  } catch (error) {
    console.error('Send message to admin error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

export const markClientMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params
    const clientId = req.user.userId

    const message = await prisma.adminClientMessage.updateMany({
      where: {
        id: messageId,
        receiverId: clientId
      },
      data: {
        isRead: true
      }
    })

    res.json({ success: true, updated: message.count })
  } catch (error) {
    console.error('Mark client message as read error:', error)
    res.status(500).json({ error: 'Failed to mark message as read' })
  }
}

export const getClientUnreadMessageCount = async (req, res) => {
  try {
    const clientId = req.user.userId

    const unreadCount = await prisma.adminClientMessage.count({
      where: {
        receiverId: clientId,
        isRead: false
      }
    })

    res.json({ unreadCount })
  } catch (error) {
    console.error('Get client unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

// Client Create Support Ticket Controller
export const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user.userId
    const { subject, description, priority = 'MEDIUM' } = req.body

    const supportTicket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        priority: priority.toUpperCase(),
        status: 'OPEN',
        category: 'GENERAL'
      }
    })

    res.json({
      message: 'Support ticket created successfully',
      ticket: supportTicket
    })
  } catch (error) {
    console.error('Create support ticket error:', error)
    res.status(500).json({ error: 'Failed to create support ticket' })
  }
}