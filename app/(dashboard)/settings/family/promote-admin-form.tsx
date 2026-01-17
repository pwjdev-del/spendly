"use client"

import { promoteMemberToAdmin } from "@/app/actions/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, AlertCircle, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function PromoteAdminForm() {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        setMessage(null)

        try {
            const result = await promoteMemberToAdmin(code.trim().toUpperCase())
            if ('error' in result) {
                setMessage({ type: 'error', text: result.error as string })
            } else {
                setMessage({ type: 'success', text: "Success! You are now an Admin." })
                // Refresh the page to update UI permissions
                setTimeout(() => {
                    router.refresh()
                }, 1500)
            }
        } catch (err) {
            setMessage({ type: 'error', text: "An unexpected error occurred." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 mb-6">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                    Become an Admin
                </CardTitle>
                <CardDescription className="text-blue-700/80 dark:text-blue-400/80">
                    Received a Co-Admin invite code? Enter it here to upgrade your account to Admin status immediately.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                    <Input
                        placeholder="ENTER 6-CHAR CODE"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="font-mono uppercase tracking-widest bg-background"
                        maxLength={6}
                        disabled={loading || message?.type === 'success'}
                    />
                    <Button type="submit" disabled={loading || !code || message?.type === 'success'}>
                        {loading ? "Verifying..." : "Upgrade to Admin"}
                    </Button>
                </form>
                {message && (
                    <div className={`flex items-center gap-2 mt-4 text-sm font-medium ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                        {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
