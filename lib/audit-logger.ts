import prisma from "@/lib/prisma";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// Ensure we have a consistent secret key. 
// In production, this must be in ENV. For now, we fallback to a runtime key if missing (demo mode).
const ENCRYPTION_KEY = process.env.AUDIT_ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
    const iv = randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    // Ensure key length is 32 bytes
    const cipher = createCipheriv(ALGORITHM, key.length === 32 ? key : randomBytes(32), iv); // Fallback for demo safety
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export async function logAuditAction(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, any> = {}
) {
    try {
        const sensitivePayload = JSON.stringify(metadata);
        const encryptedData = encrypt(sensitivePayload);

        await prisma.auditLog.create({
            data: {
                actorId,
                action,
                entityType,
                entityId,
                encryptedData,
                // We keep metadata null or minimal if we want full secrecy, 
                // or put non-sensitive indexes here.
                metadata: "ENCRYPTED"
            }
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Fail open or closed? For audit, usually we don't block user action but we should alert admin.
    }
}
