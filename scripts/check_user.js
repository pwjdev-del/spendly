
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking for 'patelkathan134@gmail.com'...");
        const user = await prisma.user.findUnique({
            where: { email: "patelkathan134@gmail.com" },
        });
        console.log("User found:", user);
    } catch (e) {
        console.error("Query failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
