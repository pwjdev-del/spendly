
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Deleting test user...");
    await prisma.user.deleteMany({ where: { email: "test@example.com" } });
    console.log("Deleted.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
