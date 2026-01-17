"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
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
    const [isOpen, setIsOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleCameraClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setIsOpen(true)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        router.refresh() // Refresh to show new expense if any
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
                <div onClick={() => setIsOpen(true)} className="cursor-pointer h-full w-full">
                    {trigger}
                </div>
            ) : (
                <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span>New Expense</span>
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-md w-full max-h-[90vh] h-full md:h-auto overflow-y-auto p-0 border-none bg-[#FBF7F2] shadow-2xl rounded-[32px] sm:rounded-[32px]" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">New Expense</DialogTitle>
                    <div className="w-full h-full">
                        <ExpenseForm
                            trips={trips}
                            initialFile={file}
                            onCancel={handleClose}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
