const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic Plan',
      description: 'Perfect for small businesses',
      price: 5000,
      currency: 'NPR',
      duration: 30,
      features: ['Up to 1000 messages/month', 'Basic support', '1 chatbot'],
      isActive: true
    }
  })

  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium Plan',
      description: 'Ideal for growing businesses',
      price: 15000,
      currency: 'NPR',
      duration: 30,
      features: ['Up to 10000 messages/month', 'Priority support', '3 chatbots', 'Analytics'],
      isActive: true
    }
  })

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise Plan',
      description: 'For large organizations',
      price: 50000,
      currency: 'NPR',
      duration: 30,
      features: ['Unlimited messages', '24/7 support', 'Unlimited chatbots', 'Advanced analytics', 'Custom integrations'],
      isActive: true
    }
  })

  console.log('✅ Created subscription plans')

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phone: '+977-9800000000',
      company: 'SaaS Chatbot Platform'
    }
  })

  console.log('✅ Created admin user')

  // Create client users
  const clients = []
  for (let i = 0; i < 20; i++) {
    const client = await prisma.user.create({
      data: {
        email: `client${i + 1}@example.com`,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        name: faker.person.fullName(),
        role: 'CLIENT',
        status: i < 15 ? 'ACTIVE' : 'PENDING',
        emailVerified: i < 15,
        phone: faker.phone.number(),
        company: faker.company.name()
      }
    })
    clients.push(client)
  }

  console.log('✅ Created client users')

  // Create subscriptions for clients
  for (let i = 0; i < clients.length; i++) {
    const plan = i < 8 ? basicPlan : i < 15 ? premiumPlan : enterprisePlan
    await prisma.subscription.create({
      data: {
        userId: clients[i].id,
        planId: plan.id,
        status: i < 8 ? 'ACTIVE' : 'INACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  }

  console.log('✅ Created subscriptions')

  // Create chatbots for clients
  for (let i = 0; i < clients.length; i++) {
    const chatbot = await prisma.chatbot.create({
      data: {
        userId: clients[i].id,
        name: `${clients[i].company} Chatbot`,
        description: `AI-powered chatbot for ${clients[i].company}`,
        status: i < 15 ? 'ACTIVE' : 'INACTIVE',
        welcomeMessage: 'Hello! How can I help you today?',
        fallbackMessage: 'I apologize, but I didn\'t understand that. Could you please rephrase?'
      }
    })

    // Create channels for chatbot
    const channels = ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE']
    for (const channelType of channels.slice(0, Math.floor(Math.random() * 3) + 1)) {
      await prisma.channel.create({
        data: {
          chatbotId: chatbot.id,
          type: channelType,
          isActive: true,
          webhookUrl: `https://api.example.com/webhook/${chatbot.id}/${channelType.toLowerCase()}`,
          apiKey: faker.string.alphanumeric(32)
        }
      })
    }
  }

  console.log('✅ Created chatbots and channels')

  // Create customers
  for (let i = 0; i < 100; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId: client.id }
    })

    if (chatbot) {
      await prisma.customer.create({
        data: {
          chatbotId: chatbot.id,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          source: faker.helpers.arrayElement(['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'REFERRAL', 'DIRECT']),
          status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'PENDING']),
          lastContactAt: faker.date.recent()
        }
      })
    }
  }

  console.log('✅ Created customers')

  // Create conversations and messages
  for (let i = 0; i < 200; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId: client.id }
    })

    if (chatbot) {
      const customer = await prisma.customer.findFirst({
        where: { chatbotId: chatbot.id }
      })

      if (customer) {
        const conversation = await prisma.conversation.create({
          data: {
            chatbotId: chatbot.id,
            customerId: customer.id,
            channel: faker.helpers.arrayElement(['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE']),
            status: faker.helpers.arrayElement(['ACTIVE', 'CLOSED', 'PENDING']),
            lastMessageAt: faker.date.recent()
          }
        })

        // Create messages for conversation
        const messageCount = Math.floor(Math.random() * 10) + 1
        for (let j = 0; j < messageCount; j++) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              content: faker.lorem.sentence(),
              isFromCustomer: j % 2 === 0,
              createdAt: faker.date.recent()
            }
          })
        }
      }
    }
  }

  console.log('✅ Created conversations and messages')

  // Create documents
  for (let i = 0; i < 50; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    const chatbot = await prisma.chatbot.findFirst({
      where: { userId: client.id }
    })

    if (chatbot) {
      await prisma.document.create({
        data: {
          chatbotId: chatbot.id,
          filename: faker.system.fileName(),
          fileType: faker.helpers.arrayElement(['pdf', 'txt', 'docx', 'md']),
          fileSize: faker.number.int({ min: 1000, max: 10000000 }),
          status: faker.helpers.arrayElement(['PROCESSING', 'PROCESSED', 'FAILED']),
          chunksCount: faker.number.int({ min: 1, max: 100 }),
          uploadedBy: client.id,
          processedAt: faker.date.recent()
        }
      })
    }
  }

  console.log('✅ Created documents')

  // Create payments
  for (let i = 0; i < 100; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    await prisma.payment.create({
      data: {
        userId: client.id,
        amount: faker.number.int({ min: 1000, max: 100000 }),
        currency: 'NPR',
        method: faker.helpers.arrayElement(['KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CASH']),
        status: faker.helpers.arrayElement(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
        description: faker.helpers.arrayElement(['Development Fee', 'Subscription', 'Recharge']),
        transactionId: `TXN_${Date.now()}_${i}`,
        gateway: faker.helpers.arrayElement(['khalti', 'esewa'])
      }
    })
  }

  console.log('✅ Created payments')

  // Create support tickets
  for (let i = 0; i < 30; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    await prisma.supportTicket.create({
      data: {
        userId: client.id,
        subject: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
        category: faker.helpers.arrayElement(['support', 'billing', 'technical', 'feature']),
        assignedTo: adminUser.id
      }
    })
  }

  console.log('✅ Created support tickets')

  // Create notifications
  for (let i = 0; i < 50; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)]
    await prisma.notification.create({
      data: {
        userId: client.id,
        title: faker.lorem.sentence(),
        message: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(['SYSTEM', 'PAYMENT', 'UPDATE', 'ALERT', 'SUPPORT']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
        isRead: faker.datatype.boolean()
      }
    })
  }

  console.log('✅ Created notifications')

  console.log('🎉 Database seeding completed successfully!')
  console.log(`📊 Created:`)
  console.log(`   - 1 admin user`)
  console.log(`   - ${clients.length} client users`)
  console.log(`   - 3 subscription plans`)
  console.log(`   - ${clients.length} subscriptions`)
  console.log(`   - ${clients.length} chatbots`)
  console.log(`   - 100+ customers`)
  console.log(`   - 200+ conversations`)
  console.log(`   - 50+ documents`)
  console.log(`   - 100+ payments`)
  console.log(`   - 30+ support tickets`)
  console.log(`   - 50+ notifications`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
