import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    // 1. Create Default Organization
    const org = await prisma.organization.upsert({
        where: { slug: 'acme-corp' },
        update: {},
        create: {
            name: 'Acme Corp',
            slug: 'acme-corp',
            primaryColor: '#0070f3', // Next.js Blue
        },
    })

    // 2. Create Default Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@acme.com' },
        update: {},
        create: {
            email: 'admin@acme.com',
            name: 'Admin User',
            role: 'ADMIN',
            organizationId: org.id,
        },
    })

    // 3. Create Default Employee User
    const employee = await prisma.user.upsert({
        where: { email: 'employee@acme.com' },
        update: {},
        create: {
            email: 'employee@acme.com',
            name: 'John Doe',
            role: 'MEMBER', // Correction: Schema says ADMIN or MEMBER
            organizationId: org.id,
        },
    })

    // 4. Create Kathan User (for testing)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const kathan = await prisma.user.upsert({
        where: { email: 'patelkathan134@gmail.com' },
        update: {
            password: hashedPassword
        },
        create: {
            email: 'patelkathan134@gmail.com',
            name: 'Kathan Patel',
            role: 'ADMIN',
            organizationId: org.id,
            password: hashedPassword
        },
    })

    console.log({ org, admin, employee })
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
