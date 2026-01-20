"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface WhaleHelperProps {
    message: string
    position?: "top" | "bottom" | "left" | "right"
    className?: string
    size?: "sm" | "md" | "lg"
}

/**
 * WhaleHelper
 * 
 * A friendly whale mascot that provides contextual help and tips.
 * Animates on hover with a gentle wave motion.
 */
export function WhaleHelper({
    message,
    position = "right",
    className,
    size = "md"
}: WhaleHelperProps) {
    const [isHovered, setIsHovered] = useState(false)

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    }

    const tooltipPositions = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2"
    }

    return (
        <div
            className={cn("relative inline-flex items-center", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Whale Icon */}
            <div
                className={cn(
                    sizeClasses[size],
                    "relative cursor-help transition-transform duration-300",
                    isHovered && "animate-whale-wave"
                )}
            >
                <Image
                    src="/logo-icon-spendly.png"
                    alt="Spendly Helper"
                    fill
                    className="object-contain drop-shadow-md"
                />
            </div>

            {/* Tooltip */}
            <div
                className={cn(
                    "absolute z-50 pointer-events-none",
                    "px-3 py-2 text-xs font-medium",
                    "bg-card text-foreground",
                    "rounded-lg shadow-lg border border-border",
                    "transition-all duration-200",
                    tooltipPositions[position],
                    isHovered
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                )}
            >
                <div className="max-w-[200px] whitespace-normal">
                    {message}
                </div>
                {/* Speech bubble arrow */}
                <div
                    className={cn(
                        "absolute w-2 h-2 bg-card border-border rotate-45",
                        position === "top" && "bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b",
                        position === "bottom" && "top-[-5px] left-1/2 -translate-x-1/2 border-l border-t",
                        position === "left" && "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r",
                        position === "right" && "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l"
                    )}
                />
            </div>
        </div>
    )
}

/**
 * WhaleEmptyState
 * 
 * A friendly whale illustration for empty states with a customizable message.
 */
export function WhaleEmptyState({
    title,
    description,
    className
}: {
    title: string
    description?: string
    className?: string
}) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            <div className="relative w-24 h-24 mb-4 animate-gentle-float">
                <Image
                    src="/logo-icon-spendly.png"
                    alt="Spendly"
                    fill
                    className="object-contain opacity-60"
                />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-[250px]">{description}</p>
            )}
        </div>
    )
}
