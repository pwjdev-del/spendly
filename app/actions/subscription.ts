'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type SubscriptionData = {
    merchant: string
    amount: number
    currency: string
    category: string
    frequency: "WEEKLY" | "MONTHLY" | "YEARLY"
    nextDueDate: Date
    status?: "ACTIVE" | "PAUSED"
}

export async function getSubscriptions() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const whereClause: any = {
        OR: [
            { userId: session.user.id },
            ...(session.user.organizationId ? [{ organizationId: session.user.organizationId }] : [])
        ]
    }

    const subscriptions = await prisma.recurringExpense.findMany({
        where: whereClause,
        orderBy: { nextDueDate: 'asc' }
    })

    return subscriptions
}

export async function createSubscription(data: SubscriptionData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const subscription = await prisma.recurringExpense.create({
        data: {
            ...data,
            userId: session.user.id,
            organizationId: session.user.organizationId,
            status: data.status || "ACTIVE"
        }
    })

    revalidatePath("/reconciliation")
    revalidatePath("/subscriptions")
    return subscription
}

export async function updateSubscription(id: string, data: Partial<SubscriptionData>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Ensure user owns this subscription or belongs to the org
    const existing = await prisma.recurringExpense.findUnique({
        where: { id }
    })

    if (!existing) throw new Error("Subscription not found")

    const hasAccess = existing.userId === session.user.id ||
        (existing.organizationId && existing.organizationId === session.user.organizationId)

    if (!hasAccess) throw new Error("Unauthorized access to subscription")

    const updated = await prisma.recurringExpense.update({
        where: { id },
        data
    })

    revalidatePath("/reconciliation")
    revalidatePath("/subscriptions")
    return updated
}

export async function deleteSubscription(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const existing = await prisma.recurringExpense.findUnique({
        where: { id }
    })

    if (!existing) throw new Error("Subscription not found")

    const hasAccess = existing.userId === session.user.id ||
        (existing.organizationId && existing.organizationId === session.user.organizationId)

    if (!hasAccess) throw new Error("Unauthorized access to subscription")

    await prisma.recurringExpense.delete({
        where: { id }
    })

    revalidatePath("/reconciliation")
    revalidatePath("/subscriptions")
    return { success: true }
}
