import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateChatbots() {
  try {
    console.log('🔍 Checking for duplicate chatbots...')
    
    // Find all chatbots grouped by userId
    const chatbots = await prisma.chatbot.findMany({
      orderBy: [
        { userId: 'asc' },
        { createdAt: 'desc' } // Most recent first
      ]
    })
    
    const userIdMap = new Map()
    const duplicatesToDelete = []
    
    for (const chatbot of chatbots) {
      if (userIdMap.has(chatbot.userId)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(chatbot.id)
        console.log(`  ❌ Found duplicate chatbot for user ${chatbot.userId}: ${chatbot.id}`)
      } else {
        // First chatbot for this user, keep it
        userIdMap.set(chatbot.userId, chatbot.id)
        console.log(`  ✅ Keeping chatbot ${chatbot.id} for user ${chatbot.userId}`)
      }
    }
    
    if (duplicatesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicatesToDelete.length} duplicate chatbot(s)...`)
      
      const result = await prisma.chatbot.deleteMany({
        where: {
          id: {
            in: duplicatesToDelete
          }
        }
      })
      
      console.log(`✅ Deleted ${result.count} duplicate chatbot(s)`)
    } else {
      console.log('\n✅ No duplicate chatbots found!')
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateChatbots()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  })

