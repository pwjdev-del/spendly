import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const email = "patelkathan134@gmail.com"
    const user = await prisma.user.findUnique({
        where: { email }
    })
    console.log("AvatarURL:", user?.avatarUrl)
}

main()
    .finally(() => prisma.$disconnect())
