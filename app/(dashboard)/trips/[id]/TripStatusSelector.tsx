"use client"

import { useState } from "react"
import { updateTripStatus } from "@/app/actions/trips"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getAvailableStatuses, getStatusConfig, getBadgeColor } from "@/lib/trip-workflow"
import { Badge } from "@/components/ui/badge"

export function TripStatusSelector({ tripId, currentStatus, userRole }: { tripId: string, currentStatus: string, userRole: string }) {
    const availableStatuses = getAvailableStatuses(userRole)
    const currentConfig = getStatusConfig(currentStatus)

    async function onValueChange(value: string) {
        const result = await updateTripStatus(tripId, value)
        if (result?.success) {
            toast.success("Status updated")
        } else {
            toast.error(result?.error || "Failed to update status")
        }
    }

    // Determine badge color class
    const badgeClass = currentConfig ? getBadgeColor(currentConfig.color) : "bg-gray-100 text-gray-800"

    return (
        <div className="flex items-center gap-2">
            <Select defaultValue={currentStatus} onValueChange={onValueChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    {availableStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                            <span>{status.label}</span>
                        </SelectItem>
                    ))}
                    {/* If current status is not in available (role changed/restricted), show it disabled or hidden? 
                        Let's ensure it's selectable if it's the current value, or rely on Select's behavior. 
                        Actually standard Select behavior is fine. */}
                </SelectContent>
            </Select>
        </div>
    )
}
