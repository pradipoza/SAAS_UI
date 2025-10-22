import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMessagingSetup() {
  console.log('🔍 Checking messaging setup...\n')

  try {
    // Check if admin user exists
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (admin) {
      console.log('✅ Admin user found:')
      console.log('   ID:', admin.id)
      console.log('   Name:', admin.name)
      console.log('   Email:', admin.email)
      console.log('   Role:', admin.role)
    } else {
      console.log('❌ No admin user found!')
      console.log('   Please create an admin user first.')
    }
    console.log('')

    // Check if adminClientMessage table exists and has data
    const messageCount = await prisma.adminClientMessage.count()
    console.log(`📧 Total messages in database: ${messageCount}`)

    if (messageCount > 0) {
      console.log('\n📋 Recent messages:')
      const recentMessages = await prisma.adminClientMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { name: true, email: true, role: true }
          },
          receiver: {
            select: { name: true, email: true, role: true }
          }
        }
      })

      recentMessages.forEach((msg, index) => {
        console.log(`\n${index + 1}. Message ID: ${msg.id}`)
        console.log(`   From: ${msg.sender.name} (${msg.sender.role}) - ${msg.sender.email}`)
        console.log(`   To: ${msg.receiver.name} (${msg.receiver.role}) - ${msg.receiver.email}`)
        console.log(`   Subject: ${msg.subject || 'N/A'}`)
        console.log(`   Message: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`)
        console.log(`   Priority: ${msg.priority}`)
        console.log(`   Read: ${msg.isRead}`)
        console.log(`   Created: ${msg.createdAt}`)
      })
    }
    console.log('')

    // Check client users
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' }
    })
    console.log(`👥 Total client users: ${clients.length}`)
    if (clients.length > 0) {
      console.log('\nClient users:')
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (${client.email}) - ID: ${client.id}`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking setup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMessagingSetup()

