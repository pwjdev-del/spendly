"use client"

import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Check, X } from "lucide-react"
import Link from "next/link"

const plans = [
    {
        name: "Starter",
        price: "Free",
        period: "",
        description: "Perfect for individuals and small teams getting started.",
        features: [
            { text: "Up to 5 team members", included: true },
            { text: "50 receipts/month", included: true },
            { text: "Basic AI scanning", included: true },
            { text: "Mobile app access", included: true },
            { text: "Email support", included: true },
            { text: "Advanced analytics", included: false },
            { text: "Custom workflows", included: false },
            { text: "API access", included: false },
        ],
        cta: "Get started free",
        featured: false,
    },
    {
        name: "Business",
        price: "$12",
        period: "/user/month",
        description: "For growing teams that need more power and flexibility.",
        features: [
            { text: "Unlimited team members", included: true },
            { text: "Unlimited receipts", included: true },
            { text: "Advanced AI scanning", included: true },
            { text: "Mobile app access", included: true },
            { text: "Priority support", included: true },
            { text: "Advanced analytics", included: true },
            { text: "Custom workflows", included: true },
            { text: "API access", included: false },
        ],
        cta: "Start free trial",
        featured: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For large organizations with advanced needs.",
        features: [
            { text: "Unlimited everything", included: true },
            { text: "Premium AI features", included: true },
            { text: "White-glove onboarding", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "24/7 phone support", included: true },
            { text: "Custom integrations", included: true },
            { text: "Advanced security (SSO, SCIM)", included: true },
            { text: "Full API access", included: true },
        ],
        cta: "Contact sales",
        featured: false,
    },
]

export function PricingSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} id="pricing" className="relative py-32 bg-gradient-to-b from-[#0A1628] to-[#050D18] overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#2DD4BF]/5 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 bg-[#2DD4BF]/10 text-[#2DD4BF] rounded-full text-sm font-medium mb-6">
                        Simple Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Plans for every{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#5EEAD4]">
                            team size
                        </span>
                    </h2>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Start free and scale as you grow. No hidden fees, no surprises.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 ${plan.featured
                                    ? "bg-gradient-to-b from-[#2DD4BF]/20 to-[#0F1D2E] border-2 border-[#2DD4BF]/50 scale-105"
                                    : "bg-[#0F1D2E] border border-[#1E3A5F]"
                                }`}
                        >
                            {plan.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A1628] text-sm font-semibold rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                                <p className="text-white/50 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-white">{plan.price}</span>
                                <span className="text-white/50">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <Check size={18} className="text-[#2DD4BF] shrink-0" />
                                        ) : (
                                            <X size={18} className="text-white/30 shrink-0" />
                                        )}
                                        <span className={feature.included ? "text-white/80" : "text-white/30"}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.name === "Enterprise" ? "/contact" : "/register"}
                                className={`block w-full py-3 rounded-xl text-center font-semibold transition-all duration-300 ${plan.featured
                                        ? "bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A1628] hover:shadow-lg hover:shadow-[#2DD4BF]/30"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
