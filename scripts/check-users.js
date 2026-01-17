
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Checking users in database...");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    if (users.length === 0) {
        console.log("No users found. Creating test user...");
        const bcrypt = require('bcryptjs');
        try {
            const hashedPassword = await bcrypt.hash("password123", 10);

            const org = await prisma.organization.create({
                data: { name: "Test Family", slug: `test-${Date.now()}` }
            });
            const newUser = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: "test@example.com",
                    password: hashedPassword,
                    organizationId: org.id,
                    role: "ADMIN"
                }
            });
            console.log("Created test user:", newUser.email);
        } catch (err) {
            console.error("Failed to create user:", err);
        }
    }
    users.forEach(u => {
        console.log(`- ${u.email} (Role: ${u.role}, Org: ${u.organizationId})`);
        console.log(`  Hash length: ${u.password ? u.password.length : 'null'}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
