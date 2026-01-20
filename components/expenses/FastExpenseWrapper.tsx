"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Plus } from "lucide-react"
import { useExpensePanel } from "@/components/expenses/ExpensePanelContext"
import { useRouter } from "next/navigation"

interface FastExpenseWrapperProps {
    trips?: Array<{
        id: string
        tripNumber: string
        name: string
        status: string
    }>
    trigger?: React.ReactNode
}

export function FastExpenseWrapper({ trips = [], trigger }: FastExpenseWrapperProps) {
    const { open, toggle } = useExpensePanel()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            open(selectedFile)
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleClick = () => {
        // If trigger is "Scan Receipt", we might want to open file dialog first?
        // But for now, let's just open the panel.
        // Actually, if it's "Scan Receipt" usually we want to click the file input.
        // But the parent usually handles the click logic if it's a specialized trigger.
        // Wait, FastExpenseWrapper is often used just to wrap a button that opens the form.
        open()
    }

    return (
        <>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            {trigger ? (
                <div onClick={(e) => {
                    // Check if it's supposed to be a file upload trigger?
                    // The QuickActionsWidget passes a div that acts as a button.
                    // If we want to support scanning from here, we might need to know if it's a scan action.
                    // For now, let's assume if it's "Scan Receipt" text inside, we scan.
                    // Or better, let's just open the panel, and user can click Scan inside.
                    // UNLESS the user explicitly wants the camera button behavior.
                    // Let's keep it simple: just toggle the panel.
                    toggle()
                }} className="cursor-pointer h-full w-full">
                    {trigger}
                </div>
            ) : (
                <Button onClick={() => toggle()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span>New Expense</span>
                </Button>
            )}
        </>
    )
}
