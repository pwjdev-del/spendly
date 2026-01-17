"use client"

import { demoteAdminToMember } from "@/app/actions/family"
import { Button } from "@/components/ui/button"
import { ArrowDownCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DemoteButtonProps {
    userId: string
    userName: string
}

export function DemoteAdminButton({ userId, userName }: DemoteButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDemote = async () => {
        if (!confirm(`Are you sure you want to demote ${userName}? They will lose Admin privileges.`)) {
            return
        }

        setLoading(true)
        try {
            const result = await demoteAdminToMember(userId)
            if ('error' in result) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (error) {
            alert("Failed to demote user.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 px-2"
            onClick={handleDemote}
            disabled={loading}
            title="Demote to Member"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownCircle className="h-4 w-4 mr-1" />}
            {loading ? "" : "Demote"}
        </Button>
    )
}
