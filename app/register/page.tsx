"use client"

import { register } from "@/app/actions/auth"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { socialLogin } from "@/app/actions/social-auth"

function RegisterButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full rounded-full py-6 font-bold tracking-wider uppercase text-xs bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30" aria-disabled={pending}>
            {pending ? "Creating..." : "Sign Up"}
        </Button>
    )
}

export default function RegisterPage() {
    const [message, dispatch, isPending] = useActionState(register, undefined)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (message === "success") {
            router.push("/login")
        }
    }, [message, router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-100 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[850px] h-auto md:min-h-[550px] bg-background rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >

                {/* Visual Overlay - Left Side (Welcome Back) - HIDDEN ON MOBILE */}
                <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex-col justify-center items-center p-10 text-center z-20 relative">
                    {/* Motion wrapper for the whole panel sliding in */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 z-0"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        transition={{ duration: 1.0, ease: [0.6, -0.05, 0.01, 0.99] }}
                    />

                    {/* Content Fade In */}
                    <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
                        <p className="mb-8 text-white/90 leading-relaxed text-sm">
                            To keep connected with us please login with your personal info
                        </p>
                        <Link href="/login">
                            <Button
                                variant="outline"
                                className="rounded-full px-12 py-6 border-2 border-white bg-transparent text-white hover:bg-white hover:text-orange-500 transition-all font-semibold tracking-wide"
                            >
                                SIGN IN
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Form Section - Right Side (Create Account) - FULL WIDTH ON MOBILE */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center items-center bg-white text-foreground z-10 relative">
                    {/* Motion wrapper for the white panel sliding in - Desktop Only Effect ideally, but keeping standard for consistency */}
                    <motion.div
                        className="absolute inset-0 bg-white z-0 hidden md:block"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        transition={{ duration: 1.0, ease: [0.6, -0.05, 0.01, 0.99] }}
                    />

                    <div className="relative z-10 w-full flex flex-col items-center">
                        <Image
                            src="/logo-full-transparent.png"
                            alt="Kharcho"
                            width={220}
                            height={80}
                            className="mb-4 object-contain"
                            priority
                        />
                        <h1 className="text-3xl font-bold mb-6 text-orange-500">Create Account</h1>

                        {/* Social Icons */}
                        <div className="flex gap-4 mb-6">
                            {[
                                { id: 'google', label: 'G' },
                                { id: 'facebook', label: 'f' },
                            ].map((social) => (
                                <form key={social.id} action={socialLogin.bind(null, social.id)}>
                                    <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-colors text-gray-500 text-sm font-bold" type="submit">
                                        {social.label}
                                    </button>
                                </form>
                            ))}
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-colors text-gray-500 text-sm font-bold">
                                in
                            </button>
                        </div>

                        <span className="text-gray-400 text-xs mb-6 lowercase">or use your email for registration</span>

                        <form action={dispatch} className="w-full space-y-4 max-w-xs">
                            <div className="space-y-1">
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Name"
                                    required
                                    className="bg-gray-100/50 border-none rounded-none py-6 px-4 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-orange-500 text-black"
                                />
                            </div>
                            <div className="space-y-1">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    required
                                    className="bg-gray-100/50 border-none rounded-none py-6 px-4 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-orange-500 text-black"
                                />
                            </div>
                            <div className="space-y-1 relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    className="bg-gray-100/50 border-none rounded-none py-6 px-4 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-orange-500 text-black"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className="space-y-1">
                                <Input
                                    id="inviteCode"
                                    name="inviteCode"
                                    type="text"
                                    placeholder="Invite Code (Optional)"
                                    className="bg-gray-100/50 border-none rounded-none py-6 px-4 placeholder:text-gray-400 uppercase placeholder:normal-case font-mono focus-visible:ring-1 focus-visible:ring-orange-500 text-black"
                                />
                            </div>

                            {message && message !== "success" && (
                                <div className="text-xs text-red-500 text-center mt-2">
                                    {message}
                                </div>
                            )}

                            <div className="pt-4">
                                <RegisterButton />
                            </div>

                            {/* Mobile Only Login Link */}
                            <div className="mt-6 text-center text-sm text-gray-400 md:hidden">
                                Already have an account? <Link href="/login" className="text-orange-500 font-bold hover:underline">Sign In</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
