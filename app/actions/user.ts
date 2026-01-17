"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function saveDashboardLayout(layout: any[]) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { dashboardLayout: JSON.stringify(layout) }
        })
        revalidatePath("/(dashboard)")
        return { success: true }
    } catch (error) {
        console.error("Failed to save layout:", error)
        return { error: "Failed to save layout" }
    }
}
