"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { toast } from "sonner"
import { getPendingExpenses, getPendingTrips, markAsSyncing, markTripAsSyncing, markAsFailed, markTripAsFailed, removeSyncedExpense, removeSyncedTrip, saveOfflineExpense, saveOfflineTrip } from "@/lib/sync-queue"
import { createExpense } from "@/app/actions/expenses"
import { createTrip } from "@/app/actions/trips"

interface OfflineContextType {
    isOnline: boolean
    isSyncing: boolean
    saveExpenseOffline: (data: any) => Promise<void>
    saveTripOffline: (data: any) => Promise<void>
}

const OfflineContext = createContext<OfflineContextType>({
    isOnline: true,
    isSyncing: false,
    saveExpenseOffline: async () => { },
    saveTripOffline: async () => { },
})

export function useOffline() {
    return useContext(OfflineContext)
}

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
    const [isOnline, setIsOnline] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Monitor Network Status
    useEffect(() => {
        setMounted(true)
        // Set initial state only after mount
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

        const handleOnline = () => {
            setIsOnline(true)
            toast.success("Back Online! Syncing...", { id: "online-toast" })
            processSyncQueue()
        }

        const handleOffline = () => {
            setIsOnline(false)
            toast("You are Offline", {
                description: "Changes will be saved locally and synced later.",
                icon: "☁️",
                duration: 5000,
                id: "step-offline"
            })
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const processSyncQueue = async () => {
        if (isSyncing) return
        setIsSyncing(true)

        try {
            const pendingExpenses = await getPendingExpenses()
            const pendingTrips = await getPendingTrips()

            if (pendingExpenses.length === 0 && pendingTrips.length === 0) {
                setIsSyncing(false)
                return
            }

            toast.info(`Syncing ${pendingExpenses.length + pendingTrips.length} pending items...`, { id: 'sync-progress' })

            let successCount = 0

            // 1. Process Expenses
            for (const item of pendingExpenses) {
                try {
                    await markAsSyncing(item.id!)

                    // Reconstruct FormData
                    const formData = new FormData()
                    formData.append("merchant", item.merchant)
                    formData.append("amount", item.amount.toString())
                    formData.append("date", item.date.toISOString())
                    formData.append("categorySelect", item.category)

                    if (item.tripId) formData.append("tripId", item.tripId)
                    if (item.description) formData.append("description", item.description)

                    if (item.location) {
                        formData.append("latitude", item.location.latitude.toString())
                        formData.append("longitude", item.location.longitude.toString())
                    }

                    if (item.receiptImage) {
                        const file = item.receiptImage as File
                        const name = file.name || "receipt.jpg"
                        formData.append("receipt", item.receiptImage, name)
                    }

                    const result = await createExpense(null, formData)

                    if ((result as any)?.error) {
                        throw new Error((result as any).error)
                    }

                    await removeSyncedExpense(item.id!)
                    successCount++

                } catch (err: any) {
                    console.error(`Failed to sync expense ${item.id}:`, err)
                    await markAsFailed(item.id!, err.message || "Unknown error")
                }
            }

            // 2. Process Trips
            for (const trip of pendingTrips) {
                try {
                    await markTripAsSyncing(trip.id!)

                    const formData = new FormData()
                    formData.append("name", trip.name)
                    formData.append("startDate", trip.startDate.toISOString().split('T')[0])
                    formData.append("status", trip.status)

                    if (trip.description) formData.append("description", trip.description)
                    if (trip.endDate) formData.append("endDate", trip.endDate.toISOString().split('T')[0])
                    if (trip.budget) formData.append("budget", trip.budget.toString())

                    const result = await createTrip(undefined, formData) as any

                    if (result && result !== "success") {
                        throw new Error(typeof result === 'string' ? result : "Failed to sync trip")
                    }

                    await removeSyncedTrip(trip.id!)
                    successCount++

                } catch (err: any) {
                    console.error(`Failed to sync trip ${trip.id}:`, err)
                    await markTripAsFailed(trip.id!, err.message || "Unknown error")
                }
            }

            if (successCount > 0) {
                toast.success(`Synced ${successCount} items successfully!`, { id: 'sync-complete' })
            }

        } catch (error) {
            console.error("Sync Queue Error:", error)
        } finally {
            setIsSyncing(false)
        }
    }

    const saveExpenseOffline = async (expenseData: any) => {
        try {
            await saveOfflineExpense(expenseData)
            toast.success("Saved Expense to Offline Outbox 📤")
            if (navigator.onLine) processSyncQueue()
        } catch (error) {
            toast.error("Failed to save offline.")
            console.error(error)
        }
    }

    const saveTripOffline = async (tripData: any) => {
        try {
            await saveOfflineTrip(tripData)
            toast.success("Saved Trip to Offline Outbox 📤")
            if (navigator.onLine) processSyncQueue()
        } catch (error) {
            toast.error("Failed to save trip offline.")
            console.error(error)
        }
    }

    if (!mounted) return null

    return (
        <OfflineContext.Provider value={{ isOnline, isSyncing, saveExpenseOffline, saveTripOffline }}>
            {children}
        </OfflineContext.Provider>
    )
}
