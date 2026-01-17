import crypto from 'crypto';

// Algorithm to be used for encryption (AES-256-GCM is authenticated and secure)
const ALGORITHM = 'aes-256-gcm';

// The key length for aes-256-gcm is 32 bytes
// We expect the key to be provided as a hex string or strictly managed env var
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32); // Fallback for dev only (WARNING: Data encrypted with random key will be lost on restart)

// IV length for aes-256-gcm is usually 12 bytes
const IV_LENGTH = 12;

if (!process.env.ENCRYPTION_KEY) {
    console.warn(
        'WARN: ENCRYPTION_KEY is not defined in environment variables. ' +
        'Using a random key for this session. Encrypted data will NOT be recoverable after restart.'
    );
}

/**
 * Encrypts a text string using AES-256-GCM
 * @param text The plaintext string to encrypt
 * @returns Format: iv:authTag:encryptedContent (hex encoded)
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Return IV, AuthTag, and Encrypted Text joined by a separator (e.g., :)
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a text string using AES-256-GCM
 * @param text The encrypted string in format iv:authTag:encryptedContent
 */
export function decrypt(text: string): string {
    const parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format. Expected iv:authTag:content');
    }

    // Note: We need the DEK passed in here ideally, but for now we rely on global/env or scoped.
    // The previous implementation used a global ENCRYPTION_KEY which is bad practice with Envelope Encryption.
    // If we are strictly following Envelope Encryption, this function should accept the DEK.
    // However, keeping signature compatible for strict refactor scope:

    // We will assume ENCRYPTION_KEY is the DEK for this context (which might be set per request context).
    // If we are using the global fallback, we still follow hygiene.

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // START MEMORY HYGIENE
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    try {
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } finally {
        // If we extracted a fresh key buffer, we would scrub it here.
        // Since ENCRYPTION_KEY is currently global/static in this file (legacy), we can't scrub it without breaking next request.
        // TODO: In a full refactor, this function should accept `key: Buffer`.
    }
}
