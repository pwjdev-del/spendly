"use client"

import { authenticate } from "@/app/actions/auth"
import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { socialLogin } from "@/app/actions/social-auth"

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            className="w-full rounded-xl py-6 font-semibold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
            aria-disabled={pending}
        >
            {pending ? "Signing In..." : "Sign in to Dashboard"}
        </Button>
    )
}

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (errorMessage === 'success') {
            router.push('/dashboard')
        }
    }, [errorMessage, router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A1628] p-4 relative overflow-hidden">
            {/* Background Gradient Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md z-10"
            >
                {/* Card */}
                <div className="bg-[#0F1D2E] border border-[#1E3A5F] rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">

                    {/* Logo & Title */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <Image
                                src="/sia-mascot.png"
                                alt="Spendly"
                                width={120}
                                height={120}
                                className="mb-4 object-contain"
                                priority
                            />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white mb-1">Spendly</h1>
                        <p className="text-[#64748B] text-sm">Enterprise Expense Management</p>
                    </div>

                    {/* Welcome Back */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                        <p className="text-[#64748B] text-sm">Please enter your credentials</p>
                    </div>

                    {/* Form */}
                    <form action={dispatch} className="space-y-4" suppressHydrationWarning>
                        <div className="space-y-1">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                className="bg-[#1A2942] border-[#1E3A5F] rounded-xl py-6 px-4 placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-primary text-white"
                            />
                        </div>
                        <div className="space-y-1 relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                className="bg-[#1A2942] border-[#1E3A5F] rounded-xl py-6 px-4 placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-primary text-white"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-primary transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {errorMessage && errorMessage !== 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl"
                            >
                                {errorMessage}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <LoginButton />
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#1E3A5F]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#0F1D2E] px-4 text-[#64748B]">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="flex justify-center gap-4">
                        {[
                            { id: 'google', label: 'G', icon: null },
                            { id: 'facebook', label: 'f', icon: null },
                        ].map((social) => (
                            <form key={social.id} action={socialLogin.bind(null, social.id)}>
                                <button
                                    type="submit"
                                    className="w-12 h-12 rounded-xl border border-[#1E3A5F] bg-[#1A2942] flex items-center justify-center hover:bg-[#1E3A5F] hover:border-primary/50 transition-all text-white text-sm font-bold"
                                >
                                    {social.label}
                                </button>
                            </form>
                        ))}
                        {/* Apple */}
                        <form action={socialLogin.bind(null, 'apple')}>
                            <button
                                type="submit"
                                className="w-12 h-12 rounded-xl border border-[#1E3A5F] bg-[#1A2942] flex items-center justify-center hover:bg-white hover:border-white hover:text-black transition-all text-white"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.66 4.47-1.42 1.7.21 2.92.83 3.66 1.95-.58.33-1.67 1.25-1.67 3.32 0 2.5 1.67 3.66 1.67 3.66-.46 1.25-1.12 2.58-2.21 3.72M14.67 5.08c1.33-1.62 1.12-3.08 1.12-3.08-1.7.08-3.08 1.04-3.5 2.04-.42 1.08.12 2.75 1.46 2.62.04-1.12.5-1.33.92-1.58" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Register Link */}
                    <div className="mt-8 text-center text-sm text-[#64748B]">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                            Sign Up
                        </Link>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-[#64748B] text-xs mt-6">
                    © 2024 Spendly. All rights reserved.
                </p>
            </motion.div>
        </div>
    )
}
