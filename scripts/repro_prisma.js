
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    try {
        console.log("Checking if user exists...");
        const email = "m@example.com";

        // Check exist
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log("User already exists, deleting...");
            await prisma.user.delete({ where: { email } });
        }

        // Test create
        console.log("Attempting to create user 'John Doe'...");
        const hashedPassword = await bcrypt.hash("password", 10);
        const newUser = await prisma.user.create({
            data: {
                name: "John Doe",
                email: email,
                password: hashedPassword,
                role: "ADMIN"
            }
        });
        console.log("Create successful. New User:", newUser);

    } catch (e) {
        console.error("Operation failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
