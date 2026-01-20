"use client"

import { useEffect, useState } from "react"

/**
 * WhaleMascotBackground
 * 
 * A decorative background component featuring the Spendly whale mascot
 * as subtle artistic elements with floating bubble animations.
 * 
 * Design Philosophy:
 * - Whale silhouettes at 3-5% opacity as watermarks
 * - Animated bubbles rising gently
 * - Gradient mesh derived from Sky Blue palette
 */

// Simplified whale silhouette path for artistic background use
const WhaleShape = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg
        viewBox="0 0 100 60"
        fill="currentColor"
        className={className}
        style={style}
    >
        {/* Simplified whale body shape inspired by the Spendly mascot */}
        <ellipse cx="45" cy="35" rx="35" ry="22" />
        {/* Tail fin */}
        <path d="M75 35 Q90 20 95 25 Q88 35 95 45 Q90 50 75 35" />
        {/* Water spout */}
        <ellipse cx="25" cy="10" rx="3" ry="6" />
        <ellipse cx="30" cy="5" rx="2" ry="4" />
        {/* Flipper */}
        <ellipse cx="50" cy="50" rx="8" ry="4" transform="rotate(-20 50 50)" />
    </svg>
)

// Bubble particle component
const Bubble = ({
    size,
    left,
    delay,
    duration
}: {
    size: number;
    left: string;
    delay: number;
    duration: number
}) => (
    <div
        className="absolute rounded-full bg-primary/10 animate-float-bubble"
        style={{
            width: size,
            height: size,
            left,
            bottom: '-20px',
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
        }}
    />
)

export function WhaleMascotBackground() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Generate random bubbles for animation
    const bubbles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        size: Math.random() * 12 + 6,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 8,
    }))

    if (!mounted) return null

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {/* Gradient mesh background */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

            {/* Large whale - bottom right */}
            <WhaleShape
                className="absolute text-primary transition-transform duration-[20s] ease-in-out"
                style={{
                    width: '400px',
                    height: '240px',
                    right: '-50px',
                    bottom: '10%',
                    opacity: 0.03,
                    transform: 'rotate(-15deg)',
                }}
            />

            {/* Medium whale - top left */}
            <WhaleShape
                className="absolute text-sky-400 transition-transform duration-[25s] ease-in-out"
                style={{
                    width: '250px',
                    height: '150px',
                    left: '5%',
                    top: '15%',
                    opacity: 0.025,
                    transform: 'rotate(10deg) scaleX(-1)',
                }}
            />

            {/* Small whale - center right */}
            <WhaleShape
                className="absolute text-indigo-400 transition-transform duration-[18s] ease-in-out"
                style={{
                    width: '150px',
                    height: '90px',
                    right: '20%',
                    top: '40%',
                    opacity: 0.02,
                    transform: 'rotate(-5deg)',
                }}
            />

            {/* Floating bubbles */}
            {bubbles.map((bubble) => (
                <Bubble
                    key={bubble.id}
                    size={bubble.size}
                    left={bubble.left}
                    delay={bubble.delay}
                    duration={bubble.duration}
                />
            ))}

            {/* Soft glow spots */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full blur-[150px] bg-primary/5"
                style={{ right: '-200px', bottom: '-100px' }}
            />
            <div
                className="absolute w-[400px] h-[400px] rounded-full blur-[120px] bg-sky-400/5"
                style={{ left: '-100px', top: '20%' }}
            />
            <div
                className="absolute w-[300px] h-[300px] rounded-full blur-[100px] bg-indigo-400/3"
                style={{ right: '30%', top: '10%' }}
            />
        </div>
    )
}
