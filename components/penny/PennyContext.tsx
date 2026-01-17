"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface PennyContextType {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

const PennyContext = createContext<PennyContextType | undefined>(undefined)

export function PennyProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
        <PennyContext.Provider value={{
            isOpen,
            open: () => setIsOpen(true),
            close: () => setIsOpen(false),
            toggle: () => setIsOpen(prev => !prev)
        }}>
            {children}
        </PennyContext.Provider>
    )
}

export function usePenny() {
    const context = useContext(PennyContext)
    if (!context) {
        throw new Error("usePenny must be used within PennyProvider")
    }
    return context
}
