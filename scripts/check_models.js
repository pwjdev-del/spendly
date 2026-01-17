const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to instantiate
        // There isn't a direct listModels on the client instance in the node SDK easily exposed 
        // without the model manager, but let's try to just use curl or the response from the error to see what's allowed.
        // Actually, the error message literally said: "Call ListModels to see the list of available models"

        // We can test a few likely candidates by trying to generate negligible content.
        const candidates = ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];

        console.log("Testing model availability...");

        for (const modelName of candidates) {
            try {
                process.stdout.write(`Testing ${modelName}... `);
                const m = genAI.getGenerativeModel({ model: modelName });
                await m.generateContent("Hello");
                console.log("AVAILABLE ✅");
            } catch (e) {
                if (e.message.includes("404") || e.message.includes("not found")) {
                    console.log("NOT FOUND ❌");
                } else if (e.message.includes("429")) {
                    console.log("AVAILABLE (But Rate Limited) ⚠️");
                } else {
                    console.log(`ERROR: ${e.message}`);
                }
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
