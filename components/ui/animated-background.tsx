"use client"

import { motion } from "framer-motion"
import { Receipt, CreditCard, Wallet, PieChart, TrendingUp, Coins, DollarSign, PiggyBank } from "lucide-react"
import { useEffect, useState } from "react"

const icons = [
    Receipt,
    CreditCard,
    Wallet,
    PieChart,
    TrendingUp,
    Coins,
    DollarSign,
    PiggyBank
]

export function AnimatedBackground() {
    // Generate random positions for icons
    // We use state to ensure hydration match, though random on client is fine if we suppress hydration or use useEffect
    const [floatingIcons, setFloatingIcons] = useState<any[]>([])

    useEffect(() => {
        const calculateIcons = () => {
            const count = 15 // Number of floating items
            return Array.from({ length: count }).map((_, i) => {
                const Icon = icons[Math.floor(Math.random() * icons.length)]
                return {
                    id: i,
                    Icon,
                    initialX: Math.random() * 100, // vw
                    initialY: Math.random() * 100, // vh
                    duration: 15 + Math.random() * 20, // 15-35s duration
                    delay: Math.random() * 5,
                    scale: 0.5 + Math.random() * 1, // 0.5x to 1.5x size
                    opacity: 0.03 + Math.random() * 0.05 // Very subtle opacity (0.03 - 0.08)
                }
            })
        }
        setFloatingIcons(calculateIcons())
    }, [])

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
            {/* Base Gradient Mesh - Warmer Sand/Orange */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--muted),transparent_70%)] opacity-30" />
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[var(--primary)] to-transparent opacity-5 blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--primary)] rounded-full opacity-5 blur-[120px]" />

            {/* Grid Pattern Overlay - Subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Floating Icons */}
            {floatingIcons.map((item) => (
                <motion.div
                    key={item.id}
                    className="absolute text-primary/30"
                    initial={{
                        x: `${item.initialX}vw`,
                        y: `${item.initialY}vh`,
                        opacity: 0,
                        scale: 0
                    }}
                    animate={{
                        y: [
                            `${item.initialY}vh`,
                            `${item.initialY - 20}vh`, // Move up
                            `${item.initialY}vh`  // Back down (drift) or wrap?
                            // Let's just float gently
                        ],
                        x: [
                            `${item.initialX}vw`,
                            `${item.initialX + (Math.random() > 0.5 ? 5 : -5)}vw`,
                            `${item.initialX}vw`
                        ],
                        opacity: [0, item.opacity, 0], // Fade in then out
                        scale: [item.scale, item.scale * 1.1, item.scale]
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: item.delay
                    }}
                >
                    <item.Icon size={48} strokeWidth={1.5} />
                </motion.div>
            ))}
        </div>
    )
}
