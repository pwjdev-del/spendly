import { encrypt, decrypt } from '../lib/encryption';
import { randomBytes } from 'crypto';

// Use a mock key if env var is missing (though it should be present in our env)
if (!process.env.ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY missing in env, using a temporary one for test.");
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
}

function runTest() {
    console.log("🔒 Starting Encryption Verification...");

    // Test 1: Basic Round Trip
    const sensitiveData = "He Who Must Not Be Named";
    console.log(`\nTest 1 Example Data: "${sensitiveData}"`);

    const encrypted = encrypt(sensitiveData);
    console.log(`Encrypted: ${encrypted}`);

    if (encrypted === sensitiveData) {
        throw new Error("❌ Encryption failed: Output matches input!");
    }

    const decrypted = decrypt(encrypted);
    console.log(`Decrypted: "${decrypted}"`);

    if (decrypted !== sensitiveData) {
        throw new Error(`❌ Decryption mismatch! Expected "${sensitiveData}", got "${decrypted}"`);
    } else {
        console.log("✅ Test 1 Passed: Round trip successful.");
    }

    // Test 2: Invalid Ciphertext
    console.log("\nTest 2: Testing invalid ciphertext handling...");
    const badText = "invalid:format:here";
    const failDecryption = decrypt(badText);
    if (failDecryption === null) {
        console.log("✅ Test 2 Passed: Invalid format returned null safely.");
    } else {
        throw new Error("❌ Test 2 Failed: Should return null for invalid format.");
    }

    // Test 3: Tampered Payload
    console.log("\nTest 3: Testing tampered payload...");
    const parts = encrypted.split(':');
    // Flip a bit in the encrypted content
    const lastChar = parts[2][parts[2].length - 1];
    const tamperedChar = lastChar === 'a' ? 'b' : 'a';
    parts[2] = parts[2].slice(0, -1) + tamperedChar;
    const tampered = parts.join(':');

    const tamperDecryption = decrypt(tampered);
    if (tamperDecryption === null) {
        console.log("✅ Test 3 Passed: Tampered payload returned null (Auth Tag Check Failed).");
    } else {
        // In GCM, verifying the auth tag is crucial. If it returns content, GCM failed us.
        throw new Error("❌ Test 3 Failed: Tampered content was decrypted!");
    }

    console.log("\n🎉 All Encryption Tests Passed!");
}

runTest();
