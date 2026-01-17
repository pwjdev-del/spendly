"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

async function getUser() {
    const session = await auth()
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })
    if (!user) throw new Error("User not found")
    return user
}

export async function addIncome(formData: FormData) {
    const amount = parseFloat(formData.get("amount") as string)
    const source = formData.get("source") as string || "Manual Deposit"

    if (!amount || amount <= 0) {
        throw new Error("Invalid amount")
    }

    const user = await getUser()

    // @ts-ignore
    if (!prisma.income) {
        throw new Error("⚠️ Server Restart Required: The Income table is not loaded. Please run 'npm run dev' again.")
    }

    // @ts-ignore
    await prisma.income.create({
        data: {
            amount,
            source,
            userId: user.id
        }
    })

    revalidatePath("/")
}

export async function updatePayoutDay(formData: FormData) {
    const day = parseInt(formData.get("day") as string)

    if (!day || day < 1 || day > 31) {
        throw new Error("Invalid day")
    }

    const user = await getUser()

    await prisma.user.update({
        where: { id: user.id },
        data: { payoutDay: day }
    })

    revalidatePath("/settings/payout")
    revalidatePath("/")
}

export async function resetBalance() {
    const user = await getUser()

    // @ts-ignore
    if (!prisma.income) return

    // Delete all income entries for this user
    // @ts-ignore
    await prisma.income.deleteMany({
        where: { userId: user.id }
    })

    revalidatePath("/")
}
