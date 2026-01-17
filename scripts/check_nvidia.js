const https = require('https');

async function checkNvidia() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        console.error("No NVIDIA_API_KEY found");
        return;
    }

    console.log("Checking NVIDIA Models...");
    console.log("Key prefix:", apiKey.substring(0, 10) + "...");

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "application/json"
            }
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text.substring(0, 500)); // Print first 500 chars

        if (response.ok) {
            const data = JSON.parse(text);
            console.log("\nFound models:");
            data.data.forEach(m => {
                if (m.id.includes("llama") || m.id.includes("vision")) {
                    console.log("- " + m.id);
                }
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkNvidia();
