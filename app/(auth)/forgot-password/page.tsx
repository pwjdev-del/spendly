"use client"

import { useActionState, useEffect } from "react"
import { forgotPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

function SubmitButton() {
    return (
        <Button className="w-full">
            Send Reset Link
        </Button>
    )
}

export default function ForgotPasswordPage() {
    const [message, dispatch] = useActionState(forgotPassword, undefined)

    useEffect(() => {
        if (message) {
            toast.info(message)
        }
    }, [message])

    // If message is present, show success state instead of form
    if (message) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-4">
                <Card className="mx-auto max-w-sm w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">Check your inbox</CardTitle>
                        <CardDescription>
                            {message}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center p-4 relative">
            <div className="absolute top-8 left-8">
                <Button variant="ghost" asChild>
                    <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                </Button>
            </div>

            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={dispatch} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
