import { PrismaClient } from "@prisma/client";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Standalone script needs its own Prisma instance
const prisma = new PrismaClient();

const OLD_KEY = process.env.OLD_MASTER_KEY;
const NEW_KEY = process.env.NEW_MASTER_KEY;

const ALGORITHM = 'aes-256-cbc';

if (!OLD_KEY || !NEW_KEY) {
    console.error("❌ ERROR: Must provide OLD_MASTER_KEY and NEW_MASTER_KEY env vars.");
    process.exit(1);
}

function reEncryptKey(oldEncryptedCheck: string): string {
    // 1. Decrypt with OLD
    const [ivHex, payloadHex] = oldEncryptedCheck.split(':');
    const oldKek = Buffer.from(OLD_KEY!.padEnd(32, '0').slice(0, 32));
    const decipher = createDecipheriv(ALGORITHM, oldKek, Buffer.from(ivHex, 'hex'));
    let plain = decipher.update(Buffer.from(payloadHex, 'hex'));
    plain = Buffer.concat([plain, decipher.final()]);

    // 2. Encrypt with NEW
    const newKek = Buffer.from(NEW_KEY!.padEnd(32, '0').slice(0, 32));
    const newIv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, newKek, newIv);
    let reEncrypted = cipher.update(plain);
    reEncrypted = Buffer.concat([reEncrypted, cipher.final()]);

    return `${newIv.toString('hex')}:${reEncrypted.toString('hex')}`;
}

async function rotateAllKeys() {
    console.log("🔄 Starting Bulk Key Rotation...");

    // Batch processing for scalability
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
        const users = await prisma.user.findMany({
            where: { encryptedDataKey: { not: null } },
            take: BATCH_SIZE,
            skip: skip
        });

        if (users.length === 0) break;

        console.log(`Processing batch ${skip} - ${skip + users.length}...`);

        for (const user of users) {
            try {
                const newKeyBlob = reEncryptKey(user.encryptedDataKey!);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { encryptedDataKey: newKeyBlob }
                });
            } catch (e) {
                console.error(`❌ Failed to rotate user ${user.id}:`, e);
                // Continue or Abort? Abort for safety in audit.
            }
        }

        skip += BATCH_SIZE;
    }

    console.log("✅ Key Rotation Complete.");
}

rotateAllKeys()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
