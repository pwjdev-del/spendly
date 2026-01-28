import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { auth } from "@/auth";
import { uploadLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    // SECURITY: Require authentication
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 20 uploads per minute
    try {
        await uploadLimiter.check(20, session.user.id!);
    } catch {
        return NextResponse.json({ error: "Upload rate limit exceeded." }, { status: 429 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const url = await storage.upload(file);

        return NextResponse.json({
            success: true,
            url
        });

    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
