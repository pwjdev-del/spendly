
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const email = "test@example.com";
    const password = "password123";

    console.log(`Checking login for ${email}...`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User NOT found.");
        return;
    }

    console.log("User found. Hash:", user.password);
    const match = await bcrypt.compare(password, user.password);
    console.log(`Password match result: ${match}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
