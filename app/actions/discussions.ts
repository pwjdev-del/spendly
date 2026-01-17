"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================
// DISCUSSIONS
// ============================================================

/**
 * Get or create a discussion for an entity
 */
export async function getOrCreateDiscussion(
    entityType: "EXPENSE" | "TRIP" | "REPORT",
    entityId: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Verify the user has access to this entity
    const hasAccess = await verifyEntityAccess(
        entityType,
        entityId,
        session.user.id,
        session.user.organizationId
    );

    if (!hasAccess) {
        throw new Error("Unauthorized - you don't have access to this entity");
    }

    // Find or create discussion
    let discussion = await prisma.discussion.findUnique({
        where: {
            entityType_entityId: { entityType, entityId },
        },
        include: {
            messages: {
                where: { deletedAt: null },
                orderBy: { createdAt: "asc" },
                include: {
                    author: { select: { id: true, name: true, email: true, image: true } },
                    mentions: {
                        include: {
                            mentionedUser: { select: { id: true, name: true, email: true } },
                        },
                    },
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "asc" },
                        include: {
                            author: { select: { id: true, name: true, email: true, image: true } },
                            mentions: {
                                include: {
                                    mentionedUser: { select: { id: true, name: true, email: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!discussion && session.user.organizationId) {
        discussion = await prisma.discussion.create({
            data: {
                entityType,
                entityId,
                organizationId: session.user.organizationId,
            },
            include: {
                messages: {
                    where: { deletedAt: null },
                    include: {
                        author: { select: { id: true, name: true, email: true, image: true } },
                        mentions: {
                            include: {
                                mentionedUser: { select: { id: true, name: true, email: true } },
                            },
                        },
                        replies: {
                            where: { deletedAt: null },
                            include: {
                                author: { select: { id: true, name: true, email: true, image: true } },
                                mentions: {
                                    include: {
                                        mentionedUser: { select: { id: true, name: true, email: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    return discussion;
}

// ============================================================
// MESSAGES
// ============================================================

const CreateMessageSchema = z.object({
    discussionId: z.string(),
    body: z.string().min(1).max(10000),
    parentId: z.string().optional(),
});

/**
 * Create a new message in a discussion
 */
export async function createMessage(data: z.infer<typeof CreateMessageSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const validated = CreateMessageSchema.parse(data);

    // Verify discussion exists and user has access
    const discussion = await prisma.discussion.findUnique({
        where: { id: validated.discussionId },
    });

    if (!discussion) {
        throw new Error("Discussion not found");
    }

    const hasAccess = await verifyEntityAccess(
        discussion.entityType as "EXPENSE" | "TRIP" | "REPORT",
        discussion.entityId,
        session.user.id,
        session.user.organizationId
    );

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    // Extract @mentions from message body
    const mentionPattern = /@(\w+(?:\.\w+)?@[\w.-]+\.\w+|\w+)/g;
    const mentions = [...validated.body.matchAll(mentionPattern)]
        .map((m) => m[1])
        .filter(Boolean);

    // Find mentioned users
    const mentionedUsers = await prisma.user.findMany({
        where: {
            OR: [
                { email: { in: mentions } },
                { name: { in: mentions } },
            ],
            organizationId: discussion.organizationId,
        },
        select: { id: true, email: true, name: true },
    });

    // Create message with mentions
    const message = await prisma.message.create({
        data: {
            body: validated.body,
            discussionId: validated.discussionId,
            authorId: session.user.id,
            parentId: validated.parentId,
            mentions: {
                create: mentionedUsers.map((user) => ({
                    mentionedUserId: user.id,
                })),
            },
        },
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            mentions: {
                include: {
                    mentionedUser: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });

    // Create notifications for mentioned users
    if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
            data: mentionedUsers.map((user) => ({
                type: "MENTION",
                userId: user.id,
                entityType: discussion.entityType,
                entityId: discussion.entityId,
                messageId: message.id,
                title: `${session.user.name || session.user.email} mentioned you`,
                body: validated.body.slice(0, 100),
            })),
        });
    }

    // Revalidate the entity page
    revalidatePath(`/expenses/${discussion.entityId}`);
    revalidatePath(`/trips/${discussion.entityId}`);

    return message;
}

/**
 * Edit a message
 */
export async function editMessage(id: string, body: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const message = await prisma.message.findUnique({
        where: { id },
        include: { discussion: true },
    });

    if (!message) {
        throw new Error("Message not found");
    }

    if (message.authorId !== session.user.id) {
        throw new Error("Unauthorized - you can only edit your own messages");
    }

    const updated = await prisma.message.update({
        where: { id },
        data: { body, editedAt: new Date() },
    });

    revalidatePath(`/expenses/${message.discussion.entityId}`);
    revalidatePath(`/trips/${message.discussion.entityId}`);

    return updated;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const message = await prisma.message.findUnique({
        where: { id },
        include: { discussion: true },
    });

    if (!message) {
        throw new Error("Message not found");
    }

    // Allow author or admin to delete
    const isAdmin = session.user.role === "ADMIN";
    if (message.authorId !== session.user.id && !isAdmin) {
        throw new Error("Unauthorized");
    }

    await prisma.message.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    revalidatePath(`/expenses/${message.discussion.entityId}`);
    revalidatePath(`/trips/${message.discussion.entityId}`);

    return { success: true };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Verify user has access to an entity
 */
async function verifyEntityAccess(
    entityType: "EXPENSE" | "TRIP" | "REPORT",
    entityId: string,
    userId: string,
    organizationId?: string | null
): Promise<boolean> {
    if (entityType === "EXPENSE") {
        const expense = await prisma.expense.findUnique({
            where: { id: entityId },
        });
        if (!expense) return false;

        // Same org or owner
        if (organizationId && expense.organizationId === organizationId) return true;
        if (expense.userId === userId) return true;
        return false;
    }

    if (entityType === "TRIP") {
        const trip = await prisma.trip.findUnique({
            where: { id: entityId },
        });
        if (!trip) return false;

        // Same org or owner or approver/auditor
        if (organizationId && trip.organizationId === organizationId) return true;
        if (trip.userId === userId) return true;
        if (trip.approverId === userId) return true;
        if (trip.auditorId === userId) return true;
        return false;
    }

    return false;
}

/**
 * Get users for @mention autocomplete
 */
export async function searchUsersForMention(query: string) {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
        return [];
    }

    const users = await prisma.user.findMany({
        where: {
            organizationId: session.user.organizationId,
            OR: [
                { name: { contains: query } },
                { email: { contains: query } },
            ],
        },
        select: { id: true, name: true, email: true, image: true },
        take: 10,
    });

    return users;
}
