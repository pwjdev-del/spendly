const https = require('https');

async function testNvidiaVision() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        console.error("No NVIDIA_API_KEY found");
        return;
    }

    console.log("Testing NVIDIA Vision API...");

    // A simple 1x1 white pixel JPEG base64
    const base64Image = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvavynLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eXqAg4SFhoeIiYqSk5SVlpeYmZqgo6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

    // Construct Data URL
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    const payload = {
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "What is in this image? Reponse briefly." },
                    { type: "image_url", image_url: { url: dataUrl } }
                ]
            }
        ],
        temperature: 0.2,
        top_p: 1,
        max_tokens: 100,
        stream: false
    };

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);

    } catch (e) {
        console.error("Error:", e);
    }
}

testNvidiaVision();
