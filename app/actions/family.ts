"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { redirect } from "next/navigation"

async function getUser() {
    const session = await auth()
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })
    if (!user) {
        // Database was likely reset, but session cookie remains.
        // Redirect to login to force re-authentication (or registration).
        redirect("/login")
    }
    return user
}

export async function getFamilyDetails() {
    const user = await getUser()

    if (!user.organizationId) {
        throw new Error("No family found")
    }

    const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!organization) throw new Error("Organization not found")

    // Only Admin (Father) can see/manage the code? 
    // For now, let's allow any member to see who is in the family, 
    // but maybe only Admin can see the code.
    // User requested "Father ... can creat small accounts".

    const isAdmin = user.role === 'ADMIN'

    // Determine Owner (First member)
    const sortedMembers = [...organization.users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const ownerId = sortedMembers[0]?.id
    const isCurrentUserOwner = user.id === ownerId

    return {
        organizationName: organization.name,
        inviteCode: isAdmin ? organization.inviteCode : null, // Mask code for children
        members: organization.users,
        currentUserRole: user.role,
        currentUserId: user.id,
        ownerId: ownerId,
        isCurrentUserOwner
    }
}

export async function generateInviteCode() {
    const user = await getUser()

    if (user.role !== 'ADMIN') {
        throw new Error("Only the Family Head (Admin) can generate invite codes.")
    }

    if (!user.organizationId) throw new Error("No organization")

    // Generate a simple 6-char code
    const code = nanoid(6).toUpperCase()

    await prisma.organization.update({
        where: { id: user.organizationId },
        data: { inviteCode: code }
    })

    revalidatePath("/settings/family")
    return code
}

export async function promoteMemberToAdmin(inviteCode: string) {
    const user = await getUser()

    if (user.role === 'ADMIN') {
        return { error: "You are already an Admin." }
    }

    if (!user.organizationId) {
        return { error: "You are not part of any family organization." }
    }

    // Verify the Invite Code
    const invite = await prisma.invite.findUnique({
        where: { code: inviteCode }
    })

    if (!invite) {
        return { error: "Invalid invite code." }
    }

    if (invite.expiresAt < new Date()) {
        return { error: "This invite code has expired." }
    }

    if (invite.role !== 'ADMIN') {
        return { error: "This code is not for Admin promotion." }
    }

    // Ensure the code belongs to the SAME organization
    if (invite.organizationId !== user.organizationId) {
        return { error: "This code belongs to a different family group. You cannot use it to upgrade your role here." }
    }

    // Update User Role
    await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
    })

    revalidatePath("/settings/family")
    revalidatePath("/dashboard") // Revalidate dashboard as it shows Admin-only widgets
    return { success: true }
}

export async function demoteAdminToMember(targetUserId: string) {
    const user = await getUser()

    if (!user.organizationId) {
        return { error: "No organization found." }
    }

    // 1. Verify Caller is the Owner (First Member)
    // We fetch the oldest member of the org
    const oldestMember = await prisma.user.findFirst({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: 'asc' }
    })

    if (!oldestMember || oldestMember.id !== user.id) {
        return { error: "Only the Main Admin (Owner) can demote other admins." }
    }

    // 2. Verify Target is in same org
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
    })

    if (!targetUser || targetUser.organizationId !== user.organizationId) {
        return { error: "Target user not found in your organization." }
    }

    if (targetUser.role !== 'ADMIN') {
        return { error: "User is not an Admin." }
    }

    if (targetUser.id === user.id) {
        return { error: "You cannot demote yourself." }
    }

    // 3. Demote
    await prisma.user.update({
        where: { id: targetUserId },
        data: { role: 'MEMBER' }
    })

    revalidatePath("/settings/family")
    return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
    const user = await getUser()

    if (user.role !== 'ADMIN') {
        throw new Error("Unauthorized: Only Admins can manage roles")
    }

    if (userId === user.id) {
        throw new Error("Cannot change your own role")
    }

    const targetUser = await prisma.user.findFirst({
        where: {
            id: userId,
            organizationId: user.organizationId
        }
    })

    if (!targetUser) throw new Error("User not found in your organization")

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    })

    revalidatePath("/settings/family")
    return { success: true }
}
