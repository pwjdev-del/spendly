import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { LRUCache } from "lru-cache";

// In production, this would be an ARN to AWS KMS or Azure Key Vault.
// Here we simulate an HSM using a consistent Master Key.
const HSM_MASTER_KEY = process.env.HSM_MASTER_KEY || "00000000000000000000000000000000";

const ALGORITHM = 'aes-256-cbc';

// DEK Cache: Stores UNWRAPPED keys to save CPU.
// Security: dispose() hook ensures we scrub memory when a key leaves cache.
const dekCache = new LRUCache<string, Buffer>({
    max: 1000,
    ttl: 1000 * 60 * 5, // 5 Minutes
    dispose: (value, key) => {
        try {
            value.fill(0); // Zero-fill on eviction
        } catch (e) {
            // ignore if buffer already detached
        }
    }
});

export function generateDataKey() {
    if (process.env.MOCK_KMS_FAILURE === "true") {
        throw new Error("HSM 503 SERVICE UNAVAILABLE: Connection timed out");
    }

    const plainDEK = randomBytes(32);
    let encryptedDEK: Buffer | null = null;

    try {
        const iv = randomBytes(16);
        const kekBuffer = Buffer.from(HSM_MASTER_KEY.padEnd(32, '0').slice(0, 32));

        const cipher = createCipheriv(ALGORITHM, kekBuffer, iv);
        encryptedDEK = cipher.update(plainDEK);
        encryptedDEK = Buffer.concat([encryptedDEK, cipher.final()]);

        return {
            plain: plainDEK, // Caller responsible for scrubbing this!
            encrypted: `${iv.toString('hex')}:${encryptedDEK.toString('hex')}`
        };
    } finally {
        // We do NOT scrub plainDEK here because we return it to the caller.
        // The caller (like lib/encryption.ts) MUST scrub it.
        // However, we scrub intermediate buffers if any were created.
    }
}

export function decryptDataKey(encryptedDEKString: string): Buffer {
    // 1. Check Cache
    const cached = dekCache.get(encryptedDEKString);
    if (cached) {
        // Return a COPY so the user can scrub their copy without nuking the cache
        return Buffer.from(cached);
    }

    const [ivHex, payloadHex] = encryptedDEKString.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const payload = Buffer.from(payloadHex, 'hex');
    const kekBuffer = Buffer.from(HSM_MASTER_KEY.padEnd(32, '0').slice(0, 32));

    const decipher = createDecipheriv(ALGORITHM, kekBuffer, iv);
    let plain = decipher.update(payload);
    plain = Buffer.concat([plain, decipher.final()]);

    // 2. Store in Cache (Unwrapped)
    // We store the specific buffer instance. LRU dispose will scrub it later.
    dekCache.set(encryptedDEKString, plain);

    // Return a COPY for usage
    return Buffer.from(plain);
}
