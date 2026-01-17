"use client"

import { useActionState, useEffect } from "react"
import { resetPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Suspense } from "react"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const router = useRouter()

    // We pass undefined as initial state
    const [message, dispatch] = useActionState(resetPassword, undefined)

    useEffect(() => {
        if (message === "success") {
            toast.success("Password reset successfully! Please login.")
            router.push("/login")
        } else if (message) {
            toast.error(message)
        }
    }, [message, router])

    if (!token) {
        return (
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl text-red-500">Invalid Link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or missing the token.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch} className="grid gap-4">
                    <input type="hidden" name="token" value={token} />

                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Reset Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
