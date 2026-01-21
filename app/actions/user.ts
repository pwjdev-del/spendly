"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateReconciliationPreferences(enabled: boolean, subscriptionEnabled?: boolean) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferences: true }
        })

        const currentPrefs = JSON.parse(user?.preferences || "{}")

        const newPrefs = {
            ...currentPrefs,
            enableSmartReconciliation: enabled,
            // Only update subscriptionEnabled if provided (to maintain backward compat if called elsewhere)
            ...(subscriptionEnabled !== undefined && { enableSubscriptionManager: subscriptionEnabled })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { preferences: JSON.stringify(newPrefs) }
        })

        revalidatePath("/(dashboard)/settings/reconciliation", "page")
        revalidatePath("/(dashboard)/reconciliation", "page")

        return { success: true }
    } catch (error) {
        console.error("Failed to update preferences", error)
        return { error: "Failed to update settings" }
    }
}
