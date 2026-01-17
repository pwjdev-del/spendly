"use server"

import { signIn } from "@/auth"

export async function socialLogin(provider: string) {
    await signIn(provider, { redirectTo: "/" })
}
