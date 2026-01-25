import { NextResponse } from "next/server";
import sharp from "sharp";

export async function GET() {
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const dbUrl = process.env.DATABASE_URL;

    // Safe Check: We do NOT return the full key, just first 4 chars + presence status
    const nvidiaStatus = nvidiaKey
        ? `Present (Starts with: ${nvidiaKey.substring(0, 4)}...)`
        : "MISSING";

    // Check if it's the specific key expected
    const expectedPrefix = "nvapi-QMxa";
    const isExpectedKey = nvidiaKey && nvidiaKey.startsWith(expectedPrefix);

    // Test Sharp
    let sharpStatus = "Unknown";
    try {
        await sharp({
            create: {
                width: 1,
                height: 1,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        }).png().toBuffer();
        sharpStatus = "Functional (Created 1x1 PNG)";
    } catch (e: any) {
        sharpStatus = `FAILED: ${e.message}`;
    }

    return NextResponse.json({
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        checks: {
            NVIDIA_API_KEY: {
                status: nvidiaStatus,
                isCorrectPrefix: !!isExpectedKey,
                length: nvidiaKey ? nvidiaKey.length : 0
            },
            DATABASE_URL: {
                status: dbUrl ? "Present" : "MISSING",
                isNeon: dbUrl ? dbUrl.includes("neon.tech") : false
            },
            SHARP_VERSION: {
                status: sharpStatus,
                version: sharp.versions?.sharp || "unknown"
            }
        }
    });
}
