"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useSia } from "./SiaContext"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function SiaButton({ className }: { className?: string }) {
    const { toggle, isOpen } = useSia()

    return (
        <motion.div
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
                "fixed bottom-6 right-6 z-50 rounded-full touch-none cursor-grab active:cursor-grabbing",
                className
            )}
        >
            <Button
                onClick={toggle}
                className={cn(
                    "h-14 w-14 rounded-full p-0 shadow-2xl transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)]",
                    "bg-white/10 backdrop-blur-md border border-white/20 dark:bg-black/20 dark:border-white/10",
                    "text-primary-foreground"
                )}
            >
                <div className="relative h-full w-full p-0.5">
                    {/* Using the app logo as requested */}
                    <img
                        src="/sia-mascot-new.png"
                        alt="Ask Sia"
                        className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                    />
                </div>
                <span className="sr-only">Ask Sia</span>
            </Button>
        </motion.div>
    )
}
