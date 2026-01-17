"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const subscriptionSchema = z.object({
    merchant: z.string().min(1, "Merchant is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().default("USD"),
    category: z.string().min(1, "Category is required"),
    frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"]),
    nextDueDate: z.coerce.date(),
})

export async function createRecurringExpense(prevState: any, formData: FormData) {
    const session = await auth()
    console.log("Create Subscription Session:", session?.user?.id, session?.user?.organizationId);

    if (!session?.user) {
        console.error("Create Subscription: Unauthorized - No User");
        return { message: "Unauthorized" }
    }

    const validatedFields = subscriptionSchema.safeParse({
        merchant: formData.get("merchant"),
        amount: formData.get("amount"),
        currency: formData.get("currency"),
        category: formData.get("category"),
        frequency: formData.get("frequency"),
        nextDueDate: formData.get("nextDueDate"),
    })

    if (!validatedFields.success) {
        console.error("Create Subscription: Validation Failed", validatedFields.error.flatten().fieldErrors);
        return { message: "Invalid fields", errors: validatedFields.error.flatten().fieldErrors }
    }

    const { merchant, amount, currency, category, frequency, nextDueDate } = validatedFields.data

    try {
        console.log("Creating subscription in DB...", { merchant, amount, frequency, userId: session.user.id });
        await prisma.recurringExpense.create({
            data: {
                merchant,
                amount,
                currency,
                category,
                frequency,
                nextDueDate,
                status: "ACTIVE",
                user: { connect: { id: session.user.id } },
                ...(session.user.organizationId
                    ? { organization: { connect: { id: session.user.organizationId } } }
                    : {}
                ),
            },
        })

        revalidatePath("/subscriptions")
        return { message: "success" }
    } catch (error) {
        console.error("Failed to create subscription Prisma Error:", error)
        return { message: `Failed to create subscription: ${error instanceof Error ? error.message : "Unknown error"}` }
    }
}

export async function deleteRecurringExpense(id: string) {
    const session = await auth()
    if (!session?.user) return

    // Authorization check
    const sub = await prisma.recurringExpense.findUnique({ where: { id } })
    if (!sub) return

    const isOwner = sub.userId === session.user.id
    const isOrgMatch = session.user.organizationId && sub.organizationId === session.user.organizationId

    if (!isOwner && !isOrgMatch) return

    await prisma.recurringExpense.delete({
        where: { id },
    })
    revalidatePath("/subscriptions")
}

export async function toggleStatus(id: string, currentStatus: string) {
    const session = await auth()
    if (!session?.user) return

    // Authorization check
    const sub = await prisma.recurringExpense.findUnique({ where: { id } })
    if (!sub) return

    const isOwner = sub.userId === session.user.id
    const isOrgMatch = session.user.organizationId && sub.organizationId === session.user.organizationId

    if (!isOwner && !isOrgMatch) return

    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"

    await prisma.recurringExpense.update({
        where: { id },
        data: { status: newStatus }
    })
    revalidatePath("/subscriptions")
}
