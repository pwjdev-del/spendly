import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/jwt";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid credentials format" },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // 2. Verify password
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // 3. Generate token
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        };

        const token = signJwt(tokenPayload, 30); // Valid for 30 days

        // 4. Return user info and token
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image || user.avatarUrl,
                role: user.role,
                organizationId: user.organizationId,
            },
        });
    } catch (error) {
        console.error("Mobile Login Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
