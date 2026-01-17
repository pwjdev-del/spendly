const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log("DATABASE_URL from env:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in database`);
    users.forEach(u => console.log(`- ${u.email}`));
}

main()
    .catch(e => console.error("Error:", e.message))
    .finally(async () => await prisma.$disconnect());
