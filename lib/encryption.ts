import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Configuration
// In a real production environment, this should be loaded strictly from environment variables.
// For this implementation, we will check for process.env.ENCRYPTION_KEY.
// If not found, we will throw an error to prevent insecure defaults in production.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const KEY_LENGTH = 32; // 32 bytes = 256 bits

function getKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error('ENCRYPTION_KEY definition is missing in environment variables.');
    }
    // If the key is hex encoded, decode it. If provided as raw string, ensure it's 32 bytes (which is rare for env vars).
    // We assume the user will provide a 64-character hex string (representing 32 bytes).
    if (keyHex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
    }
    return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a text string using AES-256-GCM.
 * format: iv:auth_tag:encrypted_content
 */
export function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return components separated by colon
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a text string using AES-256-GCM.
 * Expects format: iv:auth_tag:encrypted_content
 */
export function decrypt(text: string): string | null {
    try {
        const parts = text.split(':');
        if (parts.length !== 3) {
            // Data might not be encrypted or is corrupted
            return null;
        }

        const [ivHex, authTagHex, encryptedHex] = parts;

        // Safety check for empty parts
        if (!ivHex || !authTagHex || !encryptedHex) return null;

        const key = getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        // Return null instead of throwing to avoid crashing the app on bad data read
        return null;
    }
}
