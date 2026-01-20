"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedCounterProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
    className?: string
}

/**
 * AnimatedCounter
 * 
 * A smooth number counter that animates from 0 to the target value.
 * Uses easing for a natural feel and supports currency formatting.
 */
export function AnimatedCounter({
    value,
    duration = 1500,
    prefix = "",
    suffix = "",
    decimals = 2,
    className = ""
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const elementRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        // Use Intersection Observer to trigger animation when visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true)
                        animateValue()
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (elementRef.current) {
            observer.observe(elementRef.current)
        }

        return () => observer.disconnect()
    }, [value, hasAnimated])

    const animateValue = () => {
        const startTime = performance.now()
        const startValue = 0
        const endValue = value

        const easeOutQuart = (t: number): number => {
            return 1 - Math.pow(1 - t, 4)
        }

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = easeOutQuart(progress)

            const currentValue = startValue + (endValue - startValue) * easedProgress
            setDisplayValue(currentValue)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }

    const formattedValue = displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })

    return (
        <span ref={elementRef} className={`tabular-nums ${className}`}>
            {prefix}{formattedValue}{suffix}
        </span>
    )
}

/**
 * AnimatedCurrency
 * 
 * Specialized counter for currency values (divides by 100 for cents)
 */
export function AnimatedCurrency({
    value,
    className = ""
}: {
    value: number
    className?: string
}) {
    return (
        <AnimatedCounter
            value={value / 100}
            prefix="$"
            decimals={2}
            className={className}
        />
    )
}
