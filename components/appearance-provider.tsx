"use client"

import * as React from "react"

type FontFamily = "sans" | "serif" | "mono"
type FontSize = "sm" | "md" | "lg" | "xl"

interface AppearanceProviderState {
    fontFamily: FontFamily
    setFontFamily: (font: FontFamily) => void
    fontSize: FontSize
    setFontSize: (size: FontSize) => void
}

const initialState: AppearanceProviderState = {
    fontFamily: "sans",
    setFontFamily: () => null,
    fontSize: "md",
    setFontSize: () => null,
}

const AppearanceProviderContext = React.createContext<AppearanceProviderState>(initialState)

export function AppearanceProvider({
    children,
    defaultFontFamily = "sans",
    defaultFontSize = "md",
}: {
    children: React.ReactNode
    defaultFontFamily?: FontFamily
    defaultFontSize?: FontSize
}) {
    const [fontFamily, setFontFamily] = React.useState<FontFamily>(defaultFontFamily)
    const [fontSize, setFontSize] = React.useState<FontSize>(defaultFontSize)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const storedFont = localStorage.getItem("appearance-font-family") as FontFamily
        const storedSize = localStorage.getItem("appearance-font-size") as FontSize

        if (storedFont) setFontFamily(storedFont)
        if (storedSize) setFontSize(storedSize)
    }, [])

    React.useEffect(() => {
        if (!mounted) return
        localStorage.setItem("appearance-font-family", fontFamily)
        document.documentElement.setAttribute("data-font", fontFamily)
    }, [fontFamily, mounted])

    React.useEffect(() => {
        if (!mounted) return
        localStorage.setItem("appearance-font-size", fontSize)
        document.documentElement.setAttribute("data-font-size", fontSize)
    }, [fontSize, mounted])

    const value = {
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
    }

    return (
        <AppearanceProviderContext.Provider value={value}>
            {children}
        </AppearanceProviderContext.Provider>
    )
}

export const useAppearance = () => {
    const context = React.useContext(AppearanceProviderContext)

    if (context === undefined)
        throw new Error("useAppearance must be used within a AppearanceProvider")

    return context
}
