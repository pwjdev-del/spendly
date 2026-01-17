
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'user@example.com' // Using the email from the error if known, or generic
    // Ideally, the user should provide their email, but for seeding I'll create a test user.

    // Check if organization exists
    let org = await prisma.organization.findFirst({ where: { slug: 'default-org' } })
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Default Organization',
                slug: 'default-org',
                inviteCode: 'DEFAULT123'
            }
        })
        console.log('Created default organization')
    }

    // Create or update user
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
            organizationId: org.id,
            role: 'ADMIN'
        }
    })
    console.log('Created test user: test@example.com / password123')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
