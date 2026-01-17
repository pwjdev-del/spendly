require('dotenv').config();

async function testOpenRouter() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        console.error("No OPENROUTER_API_KEY in .env");
        return;
    }

    console.log("Testing OpenRouter Key:", key.substring(0, 10) + "...");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: { "Authorization": `Bearer ${key}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Key is valid!");
            console.log("Details:", data);
        } else {
            console.error("❌ Key verification failed:", response.status, await response.text());
        }

        // Test Chat (Text) to confirm credits
        console.log("\nTesting simple chat...");
        const chatRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "user", content: "Hi" }]
            })
        });

        if (chatRes.ok) {
            const chatData = await chatRes.json();
            console.log("✅ Chat Success:", chatData.choices[0].message.content);
        } else {
            console.error("❌ Chat Failed (likely credits/quota):", chatRes.status, await chatRes.text());
        }

    } catch (err) {
        console.error("Test Error:", err);
    }
}

testOpenRouter();
