import { NextResponse } from "next/server";

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
            }
        }
    });
}
