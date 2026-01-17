"use client"

import { generateAdminInvite } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, ShieldPlus, AlertTriangle } from "lucide-react"
import { useState } from "react"

export function AdminInviteGenerator() {
    const [code, setCode] = useState<string | null>(null)
    const [expiry, setExpiry] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await generateAdminInvite()
            if ('error' in result) {
                setError(result.error || "Unknown error occurred")
            } else {
                setCode(result.code)
                setExpiry(new Date(result.expiresAt).toLocaleString())
            }
        } catch (err) {
            setError("Failed to generate code.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (!code) return
        navigator.clipboard.writeText(code)
        alert("Copied Admin Code: " + code)
    }

    return (
        <div className="space-y-4">
            {!code ? (
                <div>
                    <Button onClick={handleGenerate} disabled={loading} variant="secondary" className="w-full sm:w-auto">
                        <ShieldPlus className="mr-2 h-4 w-4" />
                        {loading ? "Generating..." : "Generate Co-Admin Invite Code"}
                    </Button>
                    {error && (
                        <div className="flex items-center gap-2 mt-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3 bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/20">
                    <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-1">Co-Admin Invite Code</p>
                        <p className="text-xs text-muted-foreground">Share this code only with trusted family members. It grants full Admin access.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            value={code}
                            readOnly
                            className="font-mono text-center text-xl tracking-[0.5em] uppercase font-bold bg-background text-primary h-12"
                        />
                        <Button variant="outline" size="icon" onClick={handleCopy} title="Copy Code" className="h-12 w-12 shrink-0">
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                        {expiry && <p className="text-xs text-muted-foreground">Expires: {expiry}</p>}
                        <Button variant="ghost" size="sm" onClick={() => setCode(null)} className="text-xs h-auto py-1">
                            Generate Another
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
