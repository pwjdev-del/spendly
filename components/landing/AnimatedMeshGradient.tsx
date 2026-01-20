"use client"

import { useEffect, useRef } from "react"

interface GradientOrb {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    color: string
}

export function AnimatedMeshGradient() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)
    const orbsRef = useRef<GradientOrb[]>([])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener("resize", resize)

        // Initialize orbs with Kharcho palette
        const colors = [
            "rgba(45, 212, 191, 0.4)",  // Teal/Cyan
            "rgba(13, 148, 136, 0.35)", // Deep Teal
            "rgba(94, 234, 212, 0.3)",  // Light Cyan
            "rgba(20, 184, 166, 0.35)", // Mid Teal
            "rgba(99, 102, 241, 0.2)",  // Indigo accent
        ]

        orbsRef.current = colors.map((color, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: 200 + Math.random() * 300,
            color,
        }))

        const animate = () => {
            if (!ctx || !canvas) return

            // Clear with fade effect for trails
            ctx.fillStyle = "rgba(10, 22, 40, 0.03)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Update and draw orbs
            orbsRef.current.forEach((orb) => {
                orb.x += orb.vx
                orb.y += orb.vy

                // Bounce off edges
                if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius
                if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius
                if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius
                if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius

                // Draw radial gradient orb
                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, orb.radius
                )
                gradient.addColorStop(0, orb.color)
                gradient.addColorStop(1, "transparent")

                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
                ctx.fill()
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        // Initial fill
        ctx.fillStyle = "#0A1628"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        animate()

        return () => {
            window.removeEventListener("resize", resize)
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ filter: "blur(60px)" }}
        />
    )
}
