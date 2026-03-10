import { verifyJwt } from "@/lib/jwt";
import { NextResponse } from "next/server";

export function getMobileSession(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    return verifyJwt(token);
}

export function unauthorizedResponse() {
    return NextResponse.json(
        { error: "Unauthorized. Invalid or missing token." },
        { status: 401 }
    );
}
