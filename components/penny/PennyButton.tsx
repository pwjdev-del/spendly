"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePenny } from "./PennyContext"
import { cn } from "@/lib/utils"

export function PennyButton() {
    const { toggle, isOpen } = usePenny()

    return (
        <Button
            onClick={toggle}
            size="icon"
            className={cn(
                "fixed z-50 h-14 w-14 rounded-full shadow-lg",
                "bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] hover:from-[#14B8A6] hover:to-[#0F766E]",
                "text-[#0A1628] border-4 border-background",
                "transition-all duration-300 ease-out",
                "shadow-[0_0_20px_rgba(45,212,191,0.4)]",
                // Position: bottom-right, above BottomNav on mobile
                "bottom-24 right-4 md:bottom-6 md:right-6",
                // Pulse animation when closed
                !isOpen && "animate-pulse",
                // Scale down slightly and move with panel on desktop
                isOpen && "scale-90 opacity-80 md:-translate-x-[400px]"
            )}
            aria-label={isOpen ? "Close Penny" : "Open Penny AI Assistant"}
        >
            <Sparkles className={cn(
                "h-6 w-6 transition-transform duration-300",
                isOpen && "rotate-180"
            )} />
        </Button>
    )
}
