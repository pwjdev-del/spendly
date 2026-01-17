"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseQuery } from "@/lib/search";

// Validation schemas
const SavedSearchSchema = z.object({
    name: z.string().min(1).max(100),
    typeScope: z.enum(["EXPENSE", "TRIP", "RECONCILIATION", "ALL"]).default("ALL"),
    queryString: z.string().max(1000),
    uiStateJson: z.string().optional(),
    isPinned: z.boolean().default(false),
    isShared: z.boolean().default(false),
});

const UpdateSavedSearchSchema = SavedSearchSchema.partial().extend({
    id: z.string(),
});

/**
 * Create a new saved search
 */
export async function createSavedSearch(data: z.infer<typeof SavedSearchSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const validated = SavedSearchSchema.parse(data);

    // Validate the query string
    const { errors } = parseQuery(validated.queryString);
    if (errors.length > 0) {
        throw new Error(`Invalid query: ${errors.join(", ")}`);
    }

    const savedSearch = await prisma.savedSearch.create({
        data: {
            ...validated,
            ownerId: session.user.id,
            organizationId: session.user.organizationId ?? undefined,
        },
    });

    revalidatePath("/expenses");
    revalidatePath("/trips");

    return savedSearch;
}

/**
 * Get all saved searches for the current user (personal + org shared)
 */
export async function getSavedSearches(typeScope?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const where: Record<string, unknown> = {
        OR: [
            // Personal searches
            { ownerId: session.user.id },
            // Org-level shared searches
            ...(session.user.organizationId
                ? [
                    {
                        organizationId: session.user.organizationId,
                        isShared: true,
                    },
                ]
                : []),
        ],
    };

    if (typeScope && typeScope !== "ALL") {
        where.OR = (where.OR as Record<string, unknown>[]).map((condition) => ({
            ...condition,
            OR: [{ typeScope }, { typeScope: "ALL" }],
        }));
    }

    const searches = await prisma.savedSearch.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        include: {
            owner: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    return searches;
}

/**
 * Get pinned saved searches for sidebar
 */
export async function getPinnedSearches() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const searches = await prisma.savedSearch.findMany({
        where: {
            OR: [
                { ownerId: session.user.id, isPinned: true },
                ...(session.user.organizationId
                    ? [
                        {
                            organizationId: session.user.organizationId,
                            isShared: true,
                            isPinned: true,
                        },
                    ]
                    : []),
            ],
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
    });

    return searches;
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(data: z.infer<typeof UpdateSavedSearchSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const validated = UpdateSavedSearchSchema.parse(data);
    const { id, ...updateData } = validated;

    // Verify ownership
    const existing = await prisma.savedSearch.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new Error("Saved search not found");
    }

    if (existing.ownerId !== session.user.id) {
        throw new Error("Unauthorized - you can only edit your own saved searches");
    }

    // Validate query string if provided
    if (updateData.queryString) {
        const { errors } = parseQuery(updateData.queryString);
        if (errors.length > 0) {
            throw new Error(`Invalid query: ${errors.join(", ")}`);
        }
    }

    const savedSearch = await prisma.savedSearch.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/expenses");
    revalidatePath("/trips");

    return savedSearch;
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const existing = await prisma.savedSearch.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new Error("Saved search not found");
    }

    if (existing.ownerId !== session.user.id) {
        throw new Error("Unauthorized - you can only delete your own saved searches");
    }

    await prisma.savedSearch.delete({
        where: { id },
    });

    revalidatePath("/expenses");
    revalidatePath("/trips");

    return { success: true };
}

/**
 * Toggle pin status of a saved search
 */
export async function togglePinSearch(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const existing = await prisma.savedSearch.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new Error("Saved search not found");
    }

    if (existing.ownerId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    const savedSearch = await prisma.savedSearch.update({
        where: { id },
        data: { isPinned: !existing.isPinned },
    });

    revalidatePath("/expenses");
    revalidatePath("/trips");

    return savedSearch;
}

/**
 * Execute a saved search and return results
 */
export async function executeSearch(queryString: string, options?: {
    type?: "expense" | "trip";
    limit?: number;
    skip?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { where, errors, filters } = parseQuery(queryString);

    if (errors.length > 0) {
        return { results: [], errors, total: 0 };
    }

    // Add org/user scope for security
    const secureWhere = {
        AND: [
            where,
            session.user.organizationId
                ? { organizationId: session.user.organizationId }
                : { userId: session.user.id },
        ],
    };

    const type = options?.type || "expense";
    const limit = options?.limit || 50;
    const skip = options?.skip || 0;

    if (type === "expense") {
        const [results, total] = await Promise.all([
            prisma.expense.findMany({
                where: secureWhere as Record<string, unknown>,
                take: limit,
                skip,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    trip: { select: { id: true, name: true } },
                },
            }),
            prisma.expense.count({ where: secureWhere as Record<string, unknown> }),
        ]);

        return { results, errors: [], total, filters };
    }

    if (type === "trip") {
        const [results, total] = await Promise.all([
            prisma.trip.findMany({
                where: secureWhere as Record<string, unknown>,
                take: limit,
                skip,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    expenses: { select: { amount: true } },
                    _count: { select: { expenses: true } },
                },
            }),
            prisma.trip.count({ where: secureWhere as Record<string, unknown> }),
        ]);

        return { results, errors: [], total, filters };
    }

    return { results: [], errors: ["Invalid type"], total: 0 };
}
