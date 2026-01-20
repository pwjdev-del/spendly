"use client"

import { useEffect, useState } from "react"
import { HeroSection, FeatureSection, PricingSection, FAQSection, FooterSection } from "@/components/landing"
import { motion, AnimatePresence } from "framer-motion"

export function LandingPageContent() {
    const [isMobile, setIsMobile] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const checkMobile = () => {
            // Check if running in Capacitor (native app) or mobile viewport
            const isCapacitor = typeof window !== "undefined" && (window as unknown as { Capacitor?: unknown }).Capacitor
            const isMobileViewport = window.innerWidth < 768
            setIsMobile(!!isCapacitor || isMobileViewport)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#0A1628]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-12 h-12 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin"
                    />
                </div>
            </div>
        )
    }

    // For mobile/app users, redirect to login
    if (isMobile) {
        // Use client-side redirect
        if (typeof window !== "undefined") {
            window.location.href = "/login"
        }
        return (
            <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-12 h-12 border-4 border-[#2DD4BF]/30 border-t-[#2DD4BF] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Redirecting...</p>
                </motion.div>
            </div>
        )
    }

    // Desktop: Full marketing landing page
    return (
        <AnimatePresence>
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bg-[#0A1628] overflow-x-hidden"
            >
                {/* Smooth scroll */}
                <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
        `}</style>

                <HeroSection />
                <FeatureSection />
                <PricingSection />
                <FAQSection />
                <FooterSection />
            </motion.main>
        </AnimatePresence>
    )
}
