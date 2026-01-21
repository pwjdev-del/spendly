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
                    status: true,
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

    // Fetch active invite code
    const activeInvite = await prisma.invite.findFirst({
        where: {
            organizationId: user.organizationId,
            role: 'MEMBER',
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    })

    const inviteCode = isAdmin ? activeInvite?.code || null : null
    const inviteCodeExpiresAt = isAdmin ? activeInvite?.expiresAt || null : null

    // Determine Owner (First member)
    const sortedMembers = [...organization.users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const ownerId = sortedMembers[0]?.id
    const isCurrentUserOwner = user.id === ownerId

    return {
        organizationName: organization.name,
        inviteCode,
        inviteCodeExpiresAt,
        members: organization.users,
        currentUserRole: user.role,
        currentUserId: user.id,
        ownerId: ownerId,
        isCurrentUserOwner
    }
}

export async function generateInviteCode(expiresInHours: number = 24) {
    const user = await getUser()

    if (user.role !== 'ADMIN') {
        throw new Error("Only the Family Head (Admin) can generate invite codes.")
    }

    if (!user.organizationId) throw new Error("No organization")

    // Expire old active member invites for this organization
    await prisma.invite.updateMany({
        where: {
            organizationId: user.organizationId,
            role: 'MEMBER',
            expiresAt: { gt: new Date() }
        },
        data: { expiresAt: new Date() } // Expire them immediately
    })

    // Generate a complex code: SPND-XXXX-XXXX
    const randomPart = nanoid(8).toUpperCase().match(/.{1,4}/g)?.join('-')
    const code = `FAM-${randomPart}`

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)

    await prisma.invite.create({
        data: {
            code,
            organizationId: user.organizationId,
            role: 'MEMBER',
            expiresAt
        }
    })

    // Also update legacy field for backward compatibility if needed, 
    // OR just clear it to force new flow. Let's keep it in sync for now 
    // but the auth flow should prioritize the Invite table.
    // Actually, let's NOT update legacy to avoid confusion. Auth should look at Invite table.

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
