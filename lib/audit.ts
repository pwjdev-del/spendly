import prisma from "@/lib/prisma";

export type AuditAction =
    | "USER_LOGIN"
    | "USER_LOGOUT"
    | "ROLE_CHANGE"
    | "PASSWORD_CHANGE"
    | "VIEW_DECRYPTED_PII"
    | "CREATE_API_KEY"
    | "DELETE_API_KEY";

/**
 * Logs a security-relevant event to the database.
 * This function is fire-and-forget to avoid blocking the main request flow,
 * but errors are logged to the console.
 */
export async function logSecurityEvent(
    action: AuditAction | string, // Allow string for flexibility but prefer typed
    entityType: string,
    entityId: string | null,
    actorId: string,
    organizationId: string | null,
    metadata?: Record<string, any>
) {
    try {
        // We run this without awaiting if we want fire-and-forget, but 
        // in server actions it's often safer to await to ensure it runs before process exit.
        // For critical security logs, we await.
        await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                actorId,
                organizationId,
                metadata: metadata ? JSON.stringify(metadata) : null,
            }
        });
    } catch (error) {
        console.error(`[SECURITY] Failed to log audit event ${action}:`, error);
        // We do NOT throw here to prevent bringing down the app if logging fails,
        // unless strict compliance mode is required.
    }
}
