"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function getAdminUser() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
        throw new Error("Unauthorized")
    }

    return user
}

export async function approveUser(userId: string) {
    const admin = await getAdminUser()

    const targetUser = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!targetUser || targetUser.organizationId !== admin.organizationId) {
        throw new Error("User not found in your organization")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' }
    })

    revalidatePath("/settings/family")
    return { success: true }
}

export async function rejectUser(userId: string) {
    const admin = await getAdminUser()

    const targetUser = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!targetUser || targetUser.organizationId !== admin.organizationId) {
        throw new Error("User not found")
    }

    // Delete the user account if rejected during pending state
    await prisma.user.delete({
        where: { id: userId }
    })

    revalidatePath("/settings/family")
    return { success: true }
}

export async function updateApprovalSetting(enabled: boolean) {
    const admin = await getAdminUser()
    if (!admin.organizationId) throw new Error("No org")

    await prisma.organization.update({
        where: { id: admin.organizationId },
        data: { requireApproval: enabled }
    })

    revalidatePath("/settings/family")
    return { success: true }
}
