import { PrismaClient } from '@prisma/client'
import { createClientVectorTable, clientVectorTableExists } from '../src/services/clientVectorService.js'

const prisma = new PrismaClient()

/**
 * Script to create vector tables for existing clients who don't have one yet
 * This is useful when migrating from the old single-table system to the new
 * client-specific table system
 */
async function createVectorTablesForExistingClients() {
  try {
    console.log('🔍 Finding all client users...\n')
    
    // Get all users with CLIENT role
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (clients.length === 0) {
      console.log('✅ No client users found in the database.')
      return
    }

    console.log(`📊 Found ${clients.length} client user(s)\n`)

    let created = 0
    let alreadyExists = 0
    let failed = 0

    // Process each client
    for (const client of clients) {
      console.log(`\n📝 Processing: ${client.name} (${client.email})`)
      console.log(`   User ID: ${client.id}`)
      console.log(`   Company: ${client.company || 'N/A'}`)
      console.log(`   Registered: ${client.createdAt.toLocaleDateString()}`)

      try {
        // Check if table already exists
        const exists = await clientVectorTableExists(client.id)
        
        if (exists) {
          console.log(`   ⏭️  Vector table already exists - skipping`)
          alreadyExists++
        } else {
          // Create the vector table
          const result = await createClientVectorTable(client.id)
          console.log(`   ✅ Vector table created: ${result.fullTableName}`)
          created++
        }
      } catch (error) {
        console.error(`   ❌ Error creating vector table: ${error.message}`)
        failed++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total clients processed: ${clients.length}`)
    console.log(`✅ Vector tables created: ${created}`)
    console.log(`⏭️  Already existed: ${alreadyExists}`)
    console.log(`❌ Failed: ${failed}`)
    console.log('='.repeat(60))

    if (created > 0) {
      console.log('\n✨ Successfully created vector tables for new clients!')
    }
    
    if (failed > 0) {
      console.log('\n⚠️  Some operations failed. Please check the errors above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
console.log('='.repeat(60))
console.log('🚀 Create Vector Tables for Existing Clients')
console.log('='.repeat(60))
console.log('This script will create vector tables for all existing client users')
console.log('who do not already have one.\n')

createVectorTablesForExistingClients()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

