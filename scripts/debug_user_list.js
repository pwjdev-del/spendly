
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Listing All Users ---");
        const users = await prisma.user.findMany();
        console.log(`By the grace of the silicon gods, we found ${users.length} users.`);

        users.forEach(u => {
            console.log(`User: ${u.email} [ID: ${u.id}]`);
            console.log(` - Role: ${u.role}, Org: ${u.organizationId}`);
        });

    } catch (e) {
        console.error("FATAL: User table scan failed.");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
