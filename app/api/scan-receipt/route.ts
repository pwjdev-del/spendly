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
        // 1. PROCESS IMAGE (Clean and Resize to JPEG)
        try {
            console.log("Attempting to process image with Sharp...");
            const image = sharp(originalBuffer);
            const metadata = await image.metadata();
            console.log(`Input Image: ${metadata.format} ${metadata.width}x${metadata.height}`);

            // Resize to ensure it fits within token limits and is optimized
            finalBuffer = await image
                .rotate() // Auto-rotate based on EXIF
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();

            // Sharp successfully converted to JPEG
            mimeType = "image/jpeg";
            console.log("Image successfully processed and converted to JPEG.");

        } catch (error: any) {
            console.warn("Sharp processing failed (likely missing binaries or unsupported format).");
            console.warn("Error details:", error.message);

            // Fallback: Use original buffer
            finalBuffer = originalBuffer;

            // DEBUG: Log first 20 bytes to debug magic number mismatch
            console.log("DEBUG: Magic Bytes (Hex):", finalBuffer.subarray(0, 20).toString('hex').toUpperCase());

            // Helper to check magic bytes
            const isJpeg = finalBuffer[0] === 0xFF && finalBuffer[1] === 0xD8 && finalBuffer[2] === 0xFF;
            const isPng = finalBuffer[0] === 0x89 && finalBuffer[1] === 0x50 && finalBuffer[2] === 0x4E && finalBuffer[3] === 0x47;
            const isWebp = finalBuffer[0] === 0x52 && finalBuffer[1] === 0x49 && finalBuffer[2] === 0x46 && finalBuffer[3] === 0x44 &&
                finalBuffer[8] === 0x57 && finalBuffer[9] === 0x45 && finalBuffer[10] === 0x42 && finalBuffer[11] === 0x50;

            if (isJpeg) {
                mimeType = "image/jpeg";
                console.log("Fallback: Verified JPEG magic bytes.");
            } else if (isPng) {
                mimeType = "image/png";
                console.log("Fallback: Verified PNG magic bytes.");
            } else if (isWebp) {
                mimeType = "image/webp";
                console.log("Fallback: Verified WebP magic bytes.");
            } else {
                console.warn("Formatting Warning: Could not verify magic bytes. Bytes:", finalBuffer.subarray(0, 10).toString('hex'));

                // STRICT FALLBACK: If we can't identify it, and it's not a standard web type, we should fail early 
                // rather than sending garbage to the AI which causes the "cannot identify image file" 400 error.
                if (file.type && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
                    console.log(`Fallback: Magic bytes failed, but trusting file.type: ${file.type}`);
                    mimeType = file.type;
                } else {
                    console.error("Critical: Could not identify image format. Aborting.");
                    return NextResponse.json(
                        { error: "Unsupported image format. Please upload a standard JPEG or PNG image. (HEIC is not supported directly, please convert first)" },
                        { status: 400 }
                    );
                }
            }
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

                    // Explicit Auth Error Handling
                    if (status === 401 || status === 403) {
                        console.error("NVIDIA API Auth Failed! Check NVIDIA_API_KEY.");
                        console.error("Status:", status);
                        console.error("Response:", errorText);
                        throw new Error(`Authentication Failed (${status}): Invalid API Key`);
                    }

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

                // If it's an auth error, don't retry, just fail immediately
                if (error.message.includes("Authentication Failed")) {
                    throw error;
                }

                attempt++;
            }

            if (!result) {
                // If we get here inside the loop without breaking, continue or throw if max retries
                // Actually this logic implies we loop until success.
            }
        } // End of while loop

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
