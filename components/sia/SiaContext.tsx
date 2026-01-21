"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SiaContextType {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const SiaContext = createContext<SiaContextType | undefined>(undefined)

export function SiaProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const toggle = () => setIsOpen(prev => !prev)

    return (
        <SiaContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </SiaContext.Provider>
    )
}

export function useSia() {
    const context = useContext(SiaContext)
    if (context === undefined) {
        throw new Error("useSia must be used within a SiaProvider")
    }
    return context
}
