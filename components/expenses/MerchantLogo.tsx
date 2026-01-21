"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MerchantLogoProps {
    merchant: string
    category: string
    className?: string
}

export function MerchantLogo({ merchant, category, className }: MerchantLogoProps) {
    const [error, setError] = useState(false)

    // Simple heuristic to get domain from merchant name
    // This is "best effort"
    const domain = merchant.toLowerCase().replace(/\s+/g, '') + ".com"
    const logoUrl = `https://logo.clearbit.com/${domain}`

    if (error) {
        return (
            <div className={cn("flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full", className)}>
                <span className="font-bold text-xs text-zinc-500 uppercase">
                    {merchant.slice(0, 2)}
                </span>
            </div>
        )
    }

    return (
        <div className={cn("relative overflow-hidden rounded-full bg-white", className)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={logoUrl}
                alt={merchant}
                onError={() => setError(true)}
                className="w-full h-full object-cover"
            />
        </div>
    )
}
