"use client"

import { generateInviteCode } from "@/app/actions/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner" // Assuming sonner is used, if not we'll just alert or use basic state

export function InviteCodeDisplay({ initialCode }: { initialCode: string | null }) {
    const [code, setCode] = useState(initialCode)
    const [loading, setLoading] = useState(false)

    const handleCopy = async () => {
        if (!code) return
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code)
                toast.success("Copied to clipboard!")
            } else {
                // Fallback for older browsers / http
                const textArea = document.createElement("textarea")
                textArea.value = code
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand("copy") // Deprecated but effective fallback
                document.body.removeChild(textArea)
                toast.success("Copied to clipboard!")
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to copy code")
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const newCode = await generateInviteCode()
            setCode(newCode)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-4 max-w-md">
            {code ? (
                <>
                    <div className="relative flex-1">
                        <Input
                            value={code}
                            readOnly
                            className="font-mono text-center text-lg tracking-widest uppercase bg-muted"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopy} title="Copy Code">
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleGenerate} disabled={loading} title="Regenerate Code">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </>
            ) : (
                <Button onClick={handleGenerate} disabled={loading}>
                    Generate Family Code
                </Button>
            )}
        </div>
    )
}
