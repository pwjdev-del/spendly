import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        console.log("Scan Receipt API called");
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("Scan Receipt: No file uploaded");
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        console.log("Scan Receipt: File received", file.name, file.size);

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("API Error: GEMINI_API_KEY is missing");
            return NextResponse.json({ error: "Server misconfiguration: API Key missing" }, { status: 500 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        let finalBuffer: Buffer;

        // 1. PROCESS IMAGE (Clean and Resize to JPEG)
        try {
            const image = sharp(originalBuffer);
            const metadata = await image.metadata();
            console.log(`Input Image: ${metadata.format} ${metadata.width}x${metadata.height}`);

            finalBuffer = await image
                .rotate()
                .resize(1536, 1536, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();

        } catch (error: any) {
            console.warn("Sharp processing failed, using original buffer:", error.message);
            finalBuffer = originalBuffer;
        }

        // 2. CALL GOOGLE GEMINI
        const base64Image = finalBuffer.toString("base64");

        console.log("Using Google Gemini API...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
            },
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
                    await new Promise(res => setTimeout(res, 2000 * attempt)); // 2s, 4s wait
                }

                result = await model.generateContent([prompt, imagePart]);
                break; // Success

            } catch (error: any) {
                lastError = error;
                console.warn(`Attempt ${attempt + 1} failed:`, error.message);

                if (error.message?.includes("429") || error.status === 429) {
                    attempt++;
                    continue;
                }
                throw error; // Non-retryable error
            }
        }

        if (!result) {
            throw lastError || new Error("Failed to generate content after retries");
        }

        const response = await result.response;
        let jsonStr = response.text();

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

        if (error.message?.includes("429") || error.status === 429) {
            return NextResponse.json(
                { error: "AI Busy: Too many requests. Please wait a moment and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to process receipt" },
            { status: 500 }
        );
    }
}
