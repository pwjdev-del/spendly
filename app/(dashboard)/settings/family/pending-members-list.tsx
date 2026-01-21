"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { approveUser, rejectUser } from "@/app/actions/admin"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

interface Member {
    id: string
    name: string | null
    email: string | null
    createdAt: Date
}

export function PendingMembersList({ members }: { members: Member[] }) {
    if (members.length === 0) return null

    const handleApprove = async (id: string) => {
        try {
            await approveUser(id)
            toast.success("User approved")
        } catch (e) {
            toast.error("Failed to approve")
        }
    }

    const handleReject = async (id: string) => {
        try {
            await rejectUser(id)
            toast.success("User rejected")
        } catch (e) {
            toast.error("Failed to reject")
        }
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                Pending Requests
            </h3>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(member.id)}>
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(member.id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
