"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ExpensePanelContextType {
    isOpen: boolean
    file: File | null
    open: (initialFile?: File | null) => void
    close: () => void
    toggle: () => void
}

const ExpensePanelContext = createContext<ExpensePanelContextType | undefined>(undefined)

export function ExpensePanelProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    return (
        <ExpensePanelContext.Provider value={{
            isOpen,
            file,
            open: (initialFile?: File | null) => {
                setFile(initialFile || null)
                setIsOpen(true)
            },
            close: () => {
                setIsOpen(false)
                setFile(null)
            },
            toggle: () => setIsOpen(prev => !prev)
        }}>
            {children}
        </ExpensePanelContext.Provider>
    )
}

export function useExpensePanel() {
    const context = useContext(ExpensePanelContext)
    if (!context) {
        throw new Error("useExpensePanel must be used within ExpensePanelProvider")
    }
    return context
}
