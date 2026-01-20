"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Twitter, Linkedin, Github, Mail } from "lucide-react"

export function FooterSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    return (
        <footer ref={ref} className="relative bg-[#050D18] border-t border-[#1E3A5F]">
            {/* CTA Section */}
            <div className="relative py-24 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF]/10 via-transparent to-[#8B5CF6]/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#2DD4BF]/10 rounded-full blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="relative max-w-4xl mx-auto px-6 text-center"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Ready to transform your{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#5EEAD4]">
                            expense management
                        </span>
                        ?
                    </h2>
                    <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
                        Join thousands of companies already saving time and money with Kharcho.
                        Start your free trial today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A1628] px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-[#2DD4BF]/40 transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            Get started free
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition-all duration-300"
                        >
                            Talk to sales
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Footer Links */}
            <div className="border-t border-[#1E3A5F]/50 py-16 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <Image
                                src="/logo-icon-light.png"
                                alt="Kharcho"
                                width={36}
                                height={36}
                                className="object-contain"
                            />
                            <span className="text-white font-bold text-xl">Kharcho</span>
                        </div>
                        <p className="text-white/50 mb-6 max-w-xs leading-relaxed">
                            The smartest way to manage business expenses. AI-powered, team-friendly, and built for scale.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: Twitter, href: "#" },
                                { icon: Linkedin, href: "#" },
                                { icon: Github, href: "#" },
                                { icon: Mail, href: "#" },
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#2DD4BF] hover:border-[#2DD4BF]/50 transition-all duration-300"
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links columns */}
                    {[
                        {
                            title: "Product",
                            links: ["Features", "Pricing", "Integrations", "API", "Mobile Apps"],
                        },
                        {
                            title: "Company",
                            links: ["About", "Careers", "Blog", "Press", "Partners"],
                        },
                        {
                            title: "Resources",
                            links: ["Documentation", "Help Center", "Community", "Security", "Status"],
                        },
                    ].map((column) => (
                        <div key={column.title}>
                            <h4 className="text-white font-semibold mb-4">{column.title}</h4>
                            <ul className="space-y-3">
                                {column.links.map((link) => (
                                    <li key={link}>
                                        <Link
                                            href="#"
                                            className="text-white/50 hover:text-[#2DD4BF] transition-colors text-sm"
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#1E3A5F]/50 py-6 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm">
                        © 2026 Kharcho. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                            Cookie Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
