"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
    Camera,
    Brain,
    Receipt,
    TrendingUp,
    Users,
    Clock,
    Shield,
    Smartphone,
    FileCheck,
    PieChart,
    CreditCard,
    Zap,
} from "lucide-react"

const features = [
    {
        icon: Camera,
        title: "AI Receipt Scanning",
        description: "Snap a photo and our AI extracts all details in seconds. No more manual data entry.",
        gradient: "from-[#2DD4BF] to-[#14B8A6]",
        delay: 0,
    },
    {
        icon: Brain,
        title: "Smart Categorization",
        description: "Machine learning automatically categorizes expenses based on merchant and past behavior.",
        gradient: "from-[#8B5CF6] to-[#6366F1]",
        delay: 0.1,
    },
    {
        icon: TrendingUp,
        title: "Real-time Analytics",
        description: "Interactive dashboards with spending trends, budget tracking, and anomaly detection.",
        gradient: "from-[#F59E0B] to-[#EF4444]",
        delay: 0.2,
    },
    {
        icon: Users,
        title: "Team Approvals",
        description: "Multi-level approval workflows with automatic routing based on expense type and amount.",
        gradient: "from-[#EC4899] to-[#8B5CF6]",
        delay: 0.3,
    },
    {
        icon: Clock,
        title: "Policy Compliance",
        description: "Automatic policy checks flag out-of-policy expenses before they're even submitted.",
        gradient: "from-[#10B981] to-[#059669]",
        delay: 0.4,
    },
    {
        icon: Smartphone,
        title: "Mobile First",
        description: "Full-featured native apps for iOS and Android. Submit expenses from anywhere.",
        gradient: "from-[#3B82F6] to-[#1D4ED8]",
        delay: 0.5,
    },
]

const stats = [
    { value: "50%", label: "Faster expense processing" },
    { value: "99.9%", label: "Accuracy with AI scanning" },
    { value: "10x", label: "ROI within first year" },
]

const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
}

export function FeatureSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} id="features" className="relative py-32 bg-[#0A1628] overflow-hidden">
            {/* Gradient orbs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2DD4BF]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-4 py-2 bg-[#2DD4BF]/10 text-[#2DD4BF] rounded-full text-sm font-medium mb-6">
                        Everything you need
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Powerful features,{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#8B5CF6]">
                            effortless control
                        </span>
                    </h2>
                    <p className="text-xl text-white/60 max-w-3xl mx-auto">
                        From AI-powered receipt scanning to real-time analytics, Kharcho gives you complete visibility
                        and control over your company's expenses.
                    </p>
                </motion.div>

                {/* Features Grid - Bento Style */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: feature.delay }}
                            className="group relative bg-gradient-to-br from-[#0F1D2E] to-[#0F1D2E]/50 border border-[#1E3A5F] rounded-2xl p-8 hover:border-[#2DD4BF]/50 transition-all duration-500 overflow-hidden"
                        >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2DD4BF]/0 to-[#2DD4BF]/0 group-hover:from-[#2DD4BF]/5 group-hover:to-transparent transition-all duration-500" />

                            {/* Icon */}
                            <div
                                className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                            >
                                <feature.icon size={28} className="text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="relative text-xl font-semibold text-white mb-3 group-hover:text-[#2DD4BF] transition-colors">
                                {feature.title}
                            </h3>
                            <p className="relative text-white/60 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#1E3A5F]/30 to-transparent rounded-bl-3xl" />
                        </motion.div>
                    ))}
                </div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-24 grid md:grid-cols-3 gap-8"
                >
                    {stats.map((stat, index) => (
                        <div key={stat.label} className="text-center">
                            <motion.div
                                initial={{ scale: 0.5 }}
                                animate={isInView ? { scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.8 + index * 0.1, type: "spring" }}
                                className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] mb-2"
                            >
                                {stat.value}
                            </motion.div>
                            <p className="text-white/60 text-lg">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Integration logos placeholder */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="mt-24 text-center"
                >
                    <p className="text-white/40 text-sm mb-8 uppercase tracking-wider">Integrates with your favorite tools</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50">
                        {["QuickBooks", "Xero", "Slack", "SAP", "NetSuite", "Salesforce"].map((name) => (
                            <div
                                key={name}
                                className="px-6 py-3 bg-white/5 rounded-lg border border-white/10 text-white/60 text-sm font-medium"
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
