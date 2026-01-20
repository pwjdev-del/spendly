"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { usePenny } from "./PennyContext"
import { cn } from "@/lib/utils"

import { useRef } from "react"
import { motion } from "framer-motion"

export function PennyButton() {
    const { toggle, isOpen } = usePenny()
    const constraintsRef = useRef(null)

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-50" />
            <motion.button
                drag
                dragMomentum={false}
                dragConstraints={constraintsRef}
                whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                whileTap={{ cursor: "grabbing" }}
                onClick={(e) => {
                    // Prevent click if dragging
                    // Framer motion usually handles this but we want to be sure
                    toggle()
                }}
                className={cn(
                    "fixed z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center cursor-grab touch-none overflow-hidden",
                    "bg-[#0B1020] hover:bg-[#141C3A]",
                    "text-[#E9ECF7] border-4 border-[#E9ECF7]/20",
                    // Position: slightly higher than before (bottom-32 instead of bottom-24)
                    "bottom-32 right-4 md:bottom-6 md:right-6",
                    // Pulse animation when closed - disabled when dragging visually by framer, but class can stay
                    !isOpen && "animate-pulse",
                    // Scale down slightly and move with panel on desktop
                    isOpen && "scale-90 opacity-80 md:-translate-x-[400px]"
                )}
                aria-label={isOpen ? "Close Sia Sia" : "Open Sia Sia AI Assistant"}
            >
                <div className={cn(
                    "relative h-full w-full p-2 transition-transform duration-300 pointer-events-none"
                )}>
                    <Image
                        src="/sia-mascot.png"
                        alt="Sia"
                        fill
                        className="object-cover scale-150"
                    />
                </div>
            </motion.button>
        </>
    )
}
