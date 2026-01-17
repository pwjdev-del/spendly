"use client"

import { useOffline } from "@/components/providers/OfflineSyncProvider"
import { WifiOff, RefreshCw } from "lucide-react"

export function OfflineIndicator() {
    const { isOnline, isSyncing } = useOffline()

    if (isOnline && !isSyncing) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {!isOnline && (
                <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Offline Mode</span>
                </div>
            )}

            {isSyncing && (
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Syncing...</span>
                </div>
            )}
        </div>
    )
}
