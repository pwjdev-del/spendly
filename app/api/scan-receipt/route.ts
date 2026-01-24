import { NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        console.log("Scan Receipt API called (NVIDIA Mode)");
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("Scan Receipt: No file uploaded");
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        console.log("Scan Receipt: File received", file.name, file.size);

        const apiKey = process.env.NVIDIA_API_KEY;

        if (!apiKey) {
            console.error("API Error: NVIDIA_API_KEY is missing");
            return NextResponse.json({ error: "Server misconfiguration: API Key missing" }, { status: 500 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        let finalBuffer: Buffer;
        let mimeType = "image/jpeg";

        // 1. PROCESS IMAGE (Clean and Resize to JPEG)
        try {
            const image = sharp(originalBuffer);
            const metadata = await image.metadata();
            console.log(`Input Image: ${metadata.format} ${metadata.width}x${metadata.height}`);

            // Resize to ensure it fits within token limits and is optimized
            finalBuffer = await image
                .rotate() // Auto-rotate based on EXIF
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();

            mimeType = "image/jpeg"; // Sharp output is always JPEG here

        } catch (error: any) {
            console.warn("Sharp processing failed (likely missing binaries), using original buffer:", error.message);
            finalBuffer = originalBuffer;
            // Try to guess mime type from file, default to jpeg but warn
            // Since we can't easily detect mime without libraries, we'll try to rely on the file extension if available, or just send it.
            // But for Nvidia, if we say jpeg and it's png, it fails.
            // Let's rely on the file object if possible, but File is from FormData.
            if (file.type) mimeType = file.type;
        }

        // 2. CALL NVIDIA API (Llama 3.2 Vision)
        const base64Image = finalBuffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        console.log("Using Nvidia Llama 3.2 Vision API...");

        const prompt = `
            Analyze this receipt image and extract the following details into a JSON object.
            Ensure keys are exactly: merchant, amount, date, currency, category.
            - merchant: string (Store name)
            - amount: number (Total amount as a number, e.g. 15.99)
            - date: string (YYYY-MM-DD format)
            - currency: string (e.g. USD, EUR)
            - category: string (One of: "Travel", "Meals", "Software", "Office Supplies", "Marketing", "Other")

            Return ONLY raw JSON. Do not use Markdown code blocks.
        `;

        const payload = {
            model: "meta/llama-3.2-90b-vision-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ],
            temperature: 0.1,
            top_p: 1,
            max_tokens: 1024,
            stream: false
        };

        // Retry Logic for Rate Limiting
        const MAX_RETRIES = 3;
        let attempt = 0;
        let result = null;
        let lastError = null;

        while (attempt < MAX_RETRIES) {
            try {
                if (attempt > 0) {
                    console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES}...`);
                    await new Promise(res => setTimeout(res, 2000 * attempt));
                }

                const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    const status = response.status;

                    if (status === 429 || status >= 500) {
                        throw new Error(`API Error ${status}: ${errorText}`);
                    }
                    // Non-retriable error
                    throw new Error(`Fatal API Error ${status}: ${errorText}`);
                }

                result = await response.json();
                break; // Success

            } catch (error: any) {
                lastError = error;
                console.warn(`Attempt ${attempt + 1} failed:`, error.message);
                attempt++;
            }
        }

        if (!result) {
            throw lastError || new Error("Failed to generate content after retries");
        }

        let jsonStr = result.choices?.[0]?.message?.content || "";
        console.log("AI Response:", jsonStr);

        // 3. PARSE JSON
        jsonStr = jsonStr.trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        } else {
            jsonStr = jsonStr.replace(/```json|```/g, "").trim();
        }

        try {
            const data = JSON.parse(jsonStr);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("JSON Parse Error:", jsonStr);
            return NextResponse.json({
                error: `AI returned invalid format. Raw: ${jsonStr.substring(0, 50)}...`
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Receipt Scan Error:", error);

        return NextResponse.json(
            { error: error.message || "Failed to process receipt" },
            { status: 500 }
        );
    }
}
