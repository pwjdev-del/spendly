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

export async function updateMonthlyLimit(formData: FormData) {
    const limit = parseFloat(formData.get("limit") as string)

    if (!limit || limit <= 0) {
        throw new Error("Invalid limit")
    }

    const user = await getUser()

    await prisma.user.update({
        where: { id: user.id },
        data: { monthlyLimit: limit }
    })

    revalidatePath("/budgets")
    revalidatePath("/")
}

export async function resetMonthlyLimit() {
    const user = await getUser()

    await prisma.user.update({
        where: { id: user.id },
        data: { monthlyLimit: 5000.0 }
    })

    revalidatePath("/budgets")
    revalidatePath("/")
}
