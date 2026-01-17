
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
    console.error("No API KEY found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log("Fetching available models to resolve 404s...");

        const candidates = [
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash", // This worked before but hit rate limits
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest"
        ];

        // Based on user error, v1beta seems to be the default used by SDK when not specified?
        // Let's test standard usage.

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                // Not specifying apiVersion to mimic app behavior
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.countTokens("Test connectivity");
                console.log("✅ AVAILABLE");
            } catch (error) {
                if (error.message.includes("404")) {
                    console.log("❌ 404 (Not Found / Not Enabled)");
                } else if (error.message.includes("429")) {
                    console.log("⚠️ 429 (Rate Limited but Exists)");
                } else {
                    console.log(`❌ FAILED (${error.message.substring(0, 50)}...)`);
                }
            }
        }

    } catch (error) {
        console.error("Global Error:", error);
    }
}

listModels();
