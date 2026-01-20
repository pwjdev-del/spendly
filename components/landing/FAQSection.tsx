"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
    {
        question: "How does the AI receipt scanning work?",
        answer: "Our AI uses advanced computer vision and natural language processing to extract key information from receipts and invoices. Simply snap a photo or upload an image, and Penny AI will automatically identify the merchant, amount, date, category, and even individual line items. It works with handwritten receipts, crumpled paper, and even partial images.",
    },
    {
        question: "Can I integrate Kharcho with my existing accounting software?",
        answer: "Absolutely! Kharcho integrates seamlessly with QuickBooks, Xero, NetSuite, SAP, Sage, and many more. We also offer a robust REST API for custom integrations. Data syncs in real-time, so your books are always up to date.",
    },
    {
        question: "Is my data secure?",
        answer: "Security is our top priority. We use bank-grade AES-256 encryption for data at rest and TLS 1.3 for data in transit. We're SOC 2 Type II certified, GDPR compliant, and offer enterprise features like SSO, SCIM provisioning, and custom data residency options.",
    },
    {
        question: "What happens if I exceed my plan limits?",
        answer: "We'll notify you before you hit any limits. You can upgrade your plan at any time, and changes take effect immediately. We never lock you out or delete your data — you'll simply be prompted to upgrade when you need more capacity.",
    },
    {
        question: "Do you offer a mobile app?",
        answer: "Yes! Kharcho is available as a native app for iOS and Android. You can submit expenses, scan receipts, approve requests, and view reports — all from your phone. The mobile experience is fully featured, not a watered-down version.",
    },
    {
        question: "How do approval workflows work?",
        answer: "You can configure multi-level approval chains based on expense amount, category, department, or any custom criteria. Approvers receive notifications via email, push, or Slack. You can set up auto-approval rules for low-risk expenses and escalation paths for overdue approvals.",
    },
]

export function FAQSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section ref={ref} className="relative py-32 bg-[#0A1628] overflow-hidden">
            {/* Background */}
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-3xl" />

            <div className="relative max-w-4xl mx-auto px-6 md:px-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 bg-[#2DD4BF]/10 text-[#2DD4BF] rounded-full text-sm font-medium mb-6">
                        FAQ
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Frequently asked questions
                    </h2>
                    <p className="text-xl text-white/60">
                        Everything you need to know about Kharcho.
                    </p>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="border border-[#1E3A5F] rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left bg-[#0F1D2E] hover:bg-[#0F1D2E]/80 transition-colors"
                            >
                                <span className="text-white font-medium pr-4">{faq.question}</span>
                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown size={20} className="text-[#2DD4BF]" />
                                </motion.div>
                            </button>
                            <motion.div
                                initial={false}
                                animate={{
                                    height: openIndex === index ? "auto" : 0,
                                    opacity: openIndex === index ? 1 : 0,
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-5 pt-2 text-white/60 leading-relaxed bg-[#0F1D2E]/50">
                                    {faq.answer}
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
