import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { headers } from "next/headers";
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Apple from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getUser(email: string) {
    try {
        const user = await prisma.user.findFirst({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    debug: true,
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Force JWT to coexist with Credentials
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true, // Allow linking by email
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // We will enforce passwords.
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            // Fingerprinting
            let currentHash = "unknown";
            try {
                const headersList = await headers();
                const userAgent = headersList.get("user-agent") || "unknown";
                const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
                const { createHash } = await import("crypto");
                currentHash = createHash("sha256").update(`${userAgent}|${ip.split(',')[0]}`).digest("hex");
            } catch (e) {
                console.warn("Could not fetch headers for fingerprinting:", e);
            }

            if (user) {
                // Initial Sign In
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.organizationId = user.organizationId;
                // @ts-ignore
                token.canReconcile = user.canReconcile;
                // @ts-ignore
                token.picture = user.avatarUrl || user.image;
                token.deviceHash = currentHash; // Bind session to device
            } else {
                // Subsequent checks
                if (token.deviceHash && token.deviceHash !== currentHash) {
                    // Session Fixation / Hijack attempt detected
                    console.warn(`[Security] Session hijacked. Token Hash: ${token.deviceHash}, Current Hash: ${currentHash}`);
                    // Return null or throw to invalidate
                    // In NextAuth v5, returning null in jwt callback might cause issues or just empty token.
                    // We will invalidate by returning an empty object or null.
                    return {};
                }
            }
            return token;
        },
        async session({ session, token }) {
            // If token is invalid (empty from hijack check), session should be null/empty
            if (!token || !token.id) {
                // Return default/empty session if token is invalid
                return session;
            }
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.organizationId = token.organizationId as string | null;
                // @ts-ignore
                session.user.canReconcile = token.canReconcile as boolean;
                // @ts-ignore
                session.user.image = token.picture as string | null;
            }
            return session;
        },
    },
});
