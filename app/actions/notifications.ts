"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Get notifications for current user
 */
export async function getNotifications(options?: {
    unreadOnly?: boolean;
    limit?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
            ...(options?.unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit || 20,
    });

    return notifications;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    const count = await prisma.notification.count({
        where: {
            userId: session.user.id,
            readAt: null,
        },
    });

    return count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await prisma.notification.update({
        where: { id, userId: session.user.id },
        data: { readAt: new Date() },
    });

    revalidatePath("/");
    return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id,
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    revalidatePath("/");
    return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await prisma.notification.delete({
        where: { id, userId: session.user.id },
    });

    revalidatePath("/");
    return { success: true };
}

/**
 * Create a notification (internal use)
 */
export async function createNotification(data: {
    userId: string;
    type: "MENTION" | "COMMENT" | "APPROVAL_REQUEST" | "TODO";
    entityType: string;
    entityId: string;
    messageId?: string;
    title: string;
    body?: string;
}) {
    return prisma.notification.create({
        data,
    });
}
