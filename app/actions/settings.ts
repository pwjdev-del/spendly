"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function generateAdminInvite() {
    const session = await auth()

    // Check if authenticated
    if (!session?.user?.email) {
        return { error: "Unauthorized" }
    }

    // Fetch user details including organization
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })

    // Validate permission
    // Note: Assuming 'ADMIN' role string. Adjust if Enum.
    // Also, checking if user has organizationId.
    if (!user || user.role !== 'ADMIN' || !user.organizationId) {
        return { error: "Only Organization Admins can generate invites." }
    }

    // Generate secure 6-char code
    const code = nanoid(6).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    try {
        const invite = await prisma.invite.create({
            data: {
                code,
                role: 'ADMIN',
                organizationId: user.organizationId,
                expiresAt,
                // createdBy: user.id // Not in schema yet
            }
        })
        return { code: invite.code, expiresAt: invite.expiresAt }
    } catch (e) {
        console.error("Failed to create invite:", e)
        return { error: "Failed to generate invite code. Please try again." }
    }
}

export async function updateUserPreferences(preferences: any) {
    const session = await auth()

    if (!session?.user?.email) {
        return { error: "Unauthorized" }
    }

    try {
        // Fetch current preferences first to merge
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { preferences: true }
        })

        let currentPrefs = {}
        if (currentUser?.preferences) {
            try {
                currentPrefs = JSON.parse(currentUser.preferences)
            } catch (e) {
                // Ignore parse error, start fresh
            }
        }

        const newPrefs = { ...currentPrefs, ...preferences }

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                preferences: JSON.stringify(newPrefs)
            }
        })

        return { success: true }
    } catch (e) {
        console.error("Failed to update preferences:", e)
        return { error: "Failed to update settings" }
    }
}
