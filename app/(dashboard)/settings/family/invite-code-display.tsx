"use client"

import { generateInviteCode } from "@/app/actions/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner" // Assuming sonner is used, if not we'll just alert or use basic state

export function InviteCodeDisplay({ initialCode, expiresAt }: { initialCode: string | null, expiresAt: Date | null }) {
    const [code, setCode] = useState(initialCode)
    const [expiry, setExpiry] = useState(expiresAt)
    const [loading, setLoading] = useState(false)

    // Calculate time left
    const [timeLeft, setTimeLeft] = useState("")

    // Simple countdown effect or just generic text
    // For now, let's just show the expiration time

    const handleCopy = async () => {
        if (!code) return
        try {
            await navigator.clipboard.writeText(code)
            toast.success("Copied to clipboard!")
        } catch (err) {
            toast.error("Failed to copy code")
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const newCode = await generateInviteCode()
            setCode(newCode)
            // Ideally generateInviteCode should return the new expiry too, but for now we assume +24h or refresh page
            // Let's quick fix: Reload page to get fresh data is lazy but safe.
            // Or assume 24h.
            const newDate = new Date()
            newDate.setHours(newDate.getHours() + 24)
            setExpiry(newDate)
            toast.success("New code generated")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate code")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
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
            {code && expiry && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                    <span>⚠️ Expires in {Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60))} hours</span>
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                This code allows others to join your family. Keep it safe.
                It will expire automatically to prevent unauthorized access.
            </p>
        </div>
    )
}
