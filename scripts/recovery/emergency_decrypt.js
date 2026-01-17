/**
 * KHARCHO EMERGENCY RECOVERY TOOL
 * Use: Decrypts database records manually during a total API failure.
 * Requirements: @aws-sdk/client-kms, crypto (Built-in)
 * Usage: node scripts/recovery/emergency_decrypt.js
 */

const { KMSClient, DecryptCommand } = require("@aws-sdk/client-kms");
const crypto = require("crypto");

// Configuration - Use Environment Variables in Emergency
const REGION = process.env.AWS_REGION;

if (!REGION) {
    console.error("\x1b[31m[CRITICAL]\x1b[0m AWS_REGION environment variable is REQUIRED.");
    console.error("Do not rely on defaults in a disaster scenario. Explicitly set the region.");
    process.exit(1);
}

// Note: In an emergency, ensure you have AWS credentials loaded in env (AWS_ACCESS_KEY_ID, etc.)
const kmsClient = new KMSClient({ region: REGION });

/**
 * @param {string} encryptedDEK - The base64 encoded Data Encryption Key from the DB
 * @param {string} ciphertext - The base64 encoded encrypted expense data
 * @param {string} iv - The base64 encoded Initialization Vector
 * @param {string} authTag - The base64 encoded GCM Auth Tag
 */
async function emergencyDecrypt(encryptedDEK, ciphertext, iv, authTag) {
    try {
        console.log("--- Initializing Break-Glass Decryption ---");

        // Step 1: Unwrap the DEK using the Master KEK in KMS
        const decryptParams = {
            CiphertextBlob: Buffer.from(encryptedDEK, "base64"),
        };
        const { Plaintext } = await kmsClient.send(new DecryptCommand(decryptParams));
        const rawDEK = Plaintext;

        console.log("[1/2] DEK unwrapped successfully.");

        // Step 2: Decrypt the actual data using AES-256-GCM
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            rawDEK,
            Buffer.from(iv, "base64")
        );
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        let decrypted = decipher.update(ciphertext, "base64", "utf8");
        decrypted += decipher.final("utf8");

        console.log("[2/2] Data Decrypted successfully.");
        return JSON.parse(decrypted);

    } catch (error) {
        console.error("\x1b[31m[RECOVERY FAILED]\x1b[0m", error.message);
        throw error;
    }
}

// EXAMPLE USAGE MOCK (Uncomment to test if you have AWS Creds):
// (async () => {
//    try {
//      // Replace strings with DB values
//      // const result = await emergencyDecrypt("enc_dek_b64", "cipher_b64", "iv_b64", "tag_b64");
//      // console.log("Decrypted Data:", result);
//    } catch (e) { console.error(e); }
// })();

module.exports = { emergencyDecrypt };
