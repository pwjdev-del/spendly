"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { encrypt } from "@/lib/encryption"
import { logSecurityEvent } from "@/lib/audit"

export async function updateProfile(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { message: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const bio = formData.get("bio") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const avatarUrl = formData.get("avatarUrl") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Preferences handling (if they add it later, for now just keeping it simple or parsing JSON if provided)
    // const preferences = formData.get("preferences") 

    try {
        const updateData: any = {
            name,
            bio,
            // Encrypt phone number before storing
            phoneNumber: phoneNumber ? encrypt(phoneNumber) : null,
            avatarUrl: avatarUrl || undefined
        }

        let emailChanged = false

        // Only update email if it changed and is valid
        if (email && email !== session.user.email) {
            // Check if email is already taken
            const existingUser = await prisma.user.findUnique({
                where: { email }
            })
            if (existingUser) {
                return { message: "Email already in use." }
            }
            updateData.email = email
            updateData.emailVerified = null
            emailChanged = true
        }

        // Password Update Logic
        if (newPassword) {
            if (newPassword.length < 6) {
                return { message: "Password must be at least 6 characters." }
            }
            if (newPassword !== confirmPassword) {
                return { message: "Passwords do not match." }
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10)
            updateData.password = hashedPassword

            // Audit Log for password change
            await logSecurityEvent(
                "PASSWORD_CHANGE",
                "User",
                session.user.id,
                session.user.id,
                null // Org ID might not be available on session depending on auth config
            )
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })

        revalidatePath("/settings/profile")
        return {
            message: "success",
            emailChanged: emailChanged
        }
    } catch (error) {
        console.error("Failed to update profile:", error)
        return { message: "Failed to update profile" }
    }
}

export async function getBillingPortal() {
    // Stub for future billing integration (Stripe/LemonSqueezy)
    return { url: "#" }
}

export async function updateUserAvatar(avatarUrl: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            avatarUrl: avatarUrl
        }
    })

    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard")
    return { success: true }
}
