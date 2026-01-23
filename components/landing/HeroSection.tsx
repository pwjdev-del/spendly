"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react"
import { AnimatedMeshGradient } from "./AnimatedMeshGradient"

const floatAnimation = {
    initial: { y: 0 },
    animate: {
        y: [-10, 10, -10],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
}

const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
}

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
}

const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
}

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A1628]">
            {/* Animated Mesh Gradient Background */}
            <AnimatedMeshGradient />

            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A1628]/50 to-[#0A1628]" />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 lg:px-20"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/sia-mascot.png"
                            alt="Spendly"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                        <span className="text-white font-bold text-xl tracking-tight">Spendly</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Features
                        </Link>
                        <Link href="#pricing" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Pricing
                        </Link>
                        <Link href="#about" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            About
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-white/80 hover:text-white transition-colors text-sm font-medium hidden sm:block"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A1628] px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-[#2DD4BF]/30 transition-all duration-300 flex items-center gap-2"
                        >
                            Get Started <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Main Hero Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-24 pb-20">
                <motion.div
                    variants={staggerContainer as any}
                    initial="initial"
                    animate="animate"
                    className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
                >
                    {/* Left: Text Content */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <motion.div variants={fadeInUp as any} className="inline-flex items-center gap-2 bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-full px-4 py-2 mb-6">
                            <Sparkles size={14} className="text-[#2DD4BF]" />
                            <span className="text-[#2DD4BF] text-sm font-medium">AI-Powered Expense Management</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            variants={fadeInUp as any}
                            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
                        >
                            The{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] via-[#5EEAD4] to-[#14B8A6]">
                                smartest way
                            </span>{" "}
                            to manage expenses
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            variants={fadeInUp as any}
                            className="text-lg md:text-xl text-white/60 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                        >
                            From receipt scanning with AI to automated approvals and real-time insights —
                            Spendly transforms how your team handles expenses.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div variants={fadeInUp as any} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A1628] px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-[#2DD4BF]/40 transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                Start for free
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#demo"
                                className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                            >
                                Watch demo
                            </Link>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div variants={fadeInUp as any} className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                            <div className="flex items-center gap-2 text-white/50">
                                <Shield size={18} className="text-[#2DD4BF]" />
                                <span className="text-sm">Bank-grade security</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/50">
                                <Zap size={18} className="text-[#2DD4BF]" />
                                <span className="text-sm">Real-time sync</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/50">
                                <Globe size={18} className="text-[#2DD4BF]" />
                                <span className="text-sm">Works anywhere</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Floating Dashboard Preview */}
                    <motion.div
                        variants={scaleIn as any}
                        className="relative hidden lg:block"
                    >
                        <motion.div
                            variants={floatAnimation as any}
                            initial="initial"
                            animate="animate"
                            className="relative"
                        >
                            {/* Glow effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#2DD4BF]/20 to-[#14B8A6]/20 rounded-3xl blur-2xl" />

                            {/* Mock Dashboard Card */}
                            <div className="relative bg-[#0F1D2E]/90 backdrop-blur-xl border border-[#1E3A5F] rounded-2xl p-6 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 relative">
                                            <Image
                                                src="/sia-mascot.png"
                                                alt="Spendly"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">Expense Report</p>
                                            <p className="text-white/50 text-xs">January 2026</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-[#2DD4BF]/20 text-[#2DD4BF] rounded-full text-xs font-medium">
                                        Approved
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-[#1A2942] rounded-xl p-4">
                                        <p className="text-white/50 text-xs mb-1">Total Expenses</p>
                                        <p className="text-white text-2xl font-bold">$4,250</p>
                                        <p className="text-[#2DD4BF] text-xs mt-1">↓ 12% vs last month</p>
                                    </div>
                                    <div className="bg-[#1A2942] rounded-xl p-4">
                                        <p className="text-white/50 text-xs mb-1">Pending</p>
                                        <p className="text-white text-2xl font-bold">$320</p>
                                        <p className="text-yellow-400 text-xs mt-1">3 awaiting review</p>
                                    </div>
                                </div>

                                {/* Expense List Preview */}
                                <div className="space-y-3">
                                    {[
                                        { name: "Client Dinner", amount: "$185.50", category: "Meals", status: "approved" },
                                        { name: "Uber to Airport", amount: "$45.00", category: "Travel", status: "approved" },
                                        { name: "Software License", amount: "$299.00", category: "Tools", status: "pending" },
                                    ].map((expense, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + i * 0.1 }}
                                            className="flex items-center justify-between p-3 bg-[#1A2942]/50 rounded-lg border border-[#1E3A5F]/50"
                                        >
                                            <div>
                                                <p className="text-white text-sm font-medium">{expense.name}</p>
                                                <p className="text-white/40 text-xs">{expense.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white text-sm font-semibold">{expense.amount}</p>
                                                <p className={`text-xs ${expense.status === "approved" ? "text-[#2DD4BF]" : "text-yellow-400"}`}>
                                                    {expense.status}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating AI Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20, x: 20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                transition={{ delay: 1.2, duration: 0.6 }}
                                className="absolute -bottom-6 -right-6 bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] p-4 rounded-xl shadow-2xl shadow-[#2DD4BF]/30"
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles size={24} className="text-[#0A1628]" />
                                    <div>
                                        <p className="text-[#0A1628] text-sm font-bold">Penny AI</p>
                                        <p className="text-[#0A1628]/70 text-xs">Scanning receipt...</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
                >
                    <motion.div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full" />
                </motion.div>
            </motion.div>
        </section >
    )
}
