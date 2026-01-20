"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/mail"
import { nanoid } from "nanoid"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const result = await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });

        if (result?.error) {
            console.log("SignIn Error Result:", result);
            return 'Invalid credentials.';
        }

        return 'success';
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        // Catch any other errors and return a generic message
        // instead of throwing, which causes "unexpected response" on client
        console.error('Authentication error:', error);
        return 'Something went wrong.';
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const name = (formData.get("name") as string).trim()
    const email = (formData.get("email") as string).trim()
    const password = (formData.get("password") as string).trim()

    // Check for weird characters
    // console.log("Email char codes:", email.split('').map(c => c.charCodeAt(0)));

    if (!email || !password || !name) return "All fields are required"

    try {
        // SWAP TO findFirst to check if findUnique is the issue
        const existingUser = await prisma.user.findFirst({
            where: { email }
        })

        if (existingUser) {
            return "User already exists"
        }

        const inviteCode = (formData.get("inviteCode") as string)?.trim().toUpperCase()

        const hashedPassword = await bcrypt.hash(password, 10)

        let organizationId: string
        let role = "ADMIN" // Default role is ADMIN for new orgs

        if (inviteCode) {
            // 1. Check Organization (Member Invite)
            const existingOrg = await prisma.organization.findUnique({
                where: { inviteCode }
            })

            if (existingOrg) {
                organizationId = existingOrg.id
                role = "MEMBER" // Child role
            } else {
                // 2. Check Invite Table (Admin/Member Invite)
                const invite = await prisma.invite.findUnique({
                    where: { code: inviteCode },
                    include: { organization: true }
                })

                // Also check expiry
                if (!invite || invite.expiresAt < new Date()) {
                    return "Invalid or Expired Invite Code"
                }

                organizationId = invite.organizationId
                role = invite.role
            }
        } else {
            // Create new organization
            const organization = await prisma.organization.create({
                data: {
                    name: `${name}'s Family`,
                    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
                }
            })
            organizationId = organization.id
        }

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                organizationId: organizationId,
                role: role
            }
        })

        // Send Welcome Email
        await sendWelcomeEmail(email, name)

        // Automatically sign in (by redirecting to login which user then fills, 
        // or we could try to sign them in directly but Credential provider requires password re-entry usually).
        // For simplicity, we just return success and let UI redirect to login.
        return "success"
    } catch (error: any) {
        console.error("Registration error:", error);

        // Log the actual error to the file as well
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'debug_registration_new.txt');
            const logData = `
--------------------------------------------------------------------------------
Time: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
Email Tried: "${email}"
Name Tried: "${name}"
Password Length: ${password?.length}
--------------------------------------------------------------------------------
`;
            fs.appendFileSync(logPath, logData);
        } catch (e) { }

        return "An error occurred during registration"
    }
}

export async function forgotPassword(prevState: string | undefined, formData: FormData) {
    const email = (formData.get("email") as string).trim()

    try {
        const user = await prisma.user.findUnique({ where: { email } })

        if (user) {
            const token = nanoid(32)
            const expiry = new Date(Date.now() + 3600000) // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: token,
                    resetTokenExpiry: expiry
                }
            })

            await sendPasswordResetEmail(email, token)
        }

        // Always return success to prevent email enumeration
        return "If an account exists, a reset link has been sent."
    } catch (error) {
        console.error("Forgot password error:", error);
        return "An error occurred. Please try again later."
    }
}

export async function resetPassword(prevState: string | undefined, formData: FormData) {
    const token = (formData.get("token") as string).trim()
    const password = (formData.get("password") as string).trim()
    const confirmPassword = (formData.get("confirmPassword") as string).trim()

    if (!token || !password) return "Invalid request"
    if (password !== confirmPassword) return "Passwords do not match"

    try {
        // Find user with valid token
        const user = await prisma.user.findUnique({
            where: { resetToken: token }
        })

        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return "Invalid or expired reset link"
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        return "success"
    } catch (error) {
        console.error("Reset password error:", error);
        return "An error occurred. Please try again later."
    }
}
