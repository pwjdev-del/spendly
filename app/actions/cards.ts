"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

import { auth } from "@/auth"

// Reuse mock user helper
async function getMockUser() {
    const session = await auth()
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })
    if (!user) throw new Error("User not found")
    return user
}

export async function issueCard(formData: FormData) {
    const limit = parseFloat(formData.get("limit") as string)
    const nickname = formData.get("nickname") as string

    // In a real app, we would integrate with Stripe/Marqeta here to get real details.
    // For now, we mock the card details.
    const last4 = Math.floor(1000 + Math.random() * 9000).toString()

    if (!limit) throw new Error("Limit is required")

    const user = await getMockUser()

    await prisma.card.create({
        data: {
            nickname,
            last4,
            limit,
            spent: 0,
            userId: user.id,
            organizationId: user.organizationId!,
        },
    })

    revalidatePath("/cards")
    redirect("/cards")
}

export async function deleteCard(formData: FormData) {
    const id = formData.get("id") as string
    if (!id) throw new Error("Card ID is required")

    // Verify ownership
    const user = await getMockUser()
    const card = await prisma.card.findUnique({ where: { id } })

    if (!card || card.userId !== user.id) {
        throw new Error("Unauthorized")
    }

    await prisma.card.delete({ where: { id } })
    revalidatePath("/cards")
}
