"use client"

import { updateUserRole } from "@/app/actions/family"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useState } from "react"
import { ROLES } from "@/lib/permissions"

export function UserRoleSelector({ userId, currentRole, disabled }: { userId: string, currentRole: string, disabled?: boolean }) {
    const [role, setRole] = useState(currentRole)
    const [loading, setLoading] = useState(false)

    async function onRoleChange(newRole: string) {
        setLoading(true)
        try {
            const result = await updateUserRole(userId, newRole)
            if (result.success) {
                setRole(newRole)
                toast.success("Role updated successfully")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update role")
            // Revert on error if needed, but state update is simple here
        } finally {
            setLoading(false)
        }
    }

    return (
        <Select value={role} onValueChange={onRoleChange} disabled={disabled || loading}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ROLES.SUBMITTER}>Submitter</SelectItem>
                <SelectItem value={ROLES.DELEGATE}>Delegate</SelectItem>
                <SelectItem value={ROLES.APPROVER}>Approver</SelectItem>
                <SelectItem value={ROLES.AUDITOR}>Auditor</SelectItem>
                <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
            </SelectContent>
        </Select>
    )
}
