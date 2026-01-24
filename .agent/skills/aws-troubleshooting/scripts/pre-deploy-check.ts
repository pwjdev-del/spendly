import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function main() {
    console.log('\x1b[36m%s\x1b[0m', '🚀 Starting AWS Pre-Deployment Checks...')

    // 1. Check Environment Variables
    if (!process.env.DATABASE_URL) {
        console.error('\x1b[31m%s\x1b[0m', '❌ CRITICAL: DATABASE_URL is not set in the environment.')
        process.exit(1)
    }
    console.log('\x1b[32m%s\x1b[0m', '✅ DATABASE_URL is present.')

    // 2. Validate Prisma Schema
    try {
        console.log('Validating Prisma schema...')
        execSync('npx prisma validate', { stdio: 'inherit' })
        console.log('\x1b[32m%s\x1b[0m', '✅ Prisma schema is valid.')
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Prisma validation failed.')
        process.exit(1)
    }

    // 3. Verify Database Connection & Query
    console.log('Verifying Database Connection...')
    try {
        // Simple query to check connectivity
        await prisma.$connect()

        // Try a read operation to ensure we have read permissions and the tables exist
        // We'll try to count users or find the first organization, similar to verify-prisma.ts
        const orgCount = await prisma.organization.count()
        console.log(`✅ Successfully connected! Found ${orgCount} organizations.`)

        // Optional: Check for pending migrations (this is a heuristic)
        // We can't easily check for pending migrations without potentially altering state or complex logic,
        // so we'll rely on the connection + simple query as a proxy for "db is alive and schema likely matches".

    } catch (e) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Database Connection Failed!')
        console.error(e)
        // Suggest potential fixes based on error
        if (e instanceof Error) {
            if (e.message.includes('P1001')) {
                console.log('\x1b[33m%s\x1b[0m', '💡 Hint: Can\'t reach database server. Check firewall rules / public access?')
            } else if (e.message.includes('P1017')) {
                console.log('\x1b[33m%s\x1b[0m', '💡 Hint: Server closed the connection. Check connection limits or timeouts.')
            }
        }
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }

    console.log('\x1b[32m%s\x1b[0m', '🎉 All Pre-Deployment Checks Passed! Ready to deploy.')
}

main()
