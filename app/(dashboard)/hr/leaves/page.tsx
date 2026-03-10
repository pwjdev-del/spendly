"use client"

import { useEffect, useState } from "react"
import { getLeaveRecords, requestLeave } from "@/app/actions/hr"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLeaves = () => {
        getLeaveRecords().then(data => {
            setLeaves(data)
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchLeaves()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const data = new FormData(e.target as HTMLFormElement)
        await requestLeave({
            type: data.get("type") as string,
            startDate: new Date(data.get("startDate") as string),
            endDate: new Date(data.get("endDate") as string),
            reason: data.get("reason") as string,
        })
        fetchLeaves()
            ; (e.target as HTMLFormElement).reset()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h1 className="text-3xl font-bold mb-6">Leave Requests</h1>
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle>Request Time Off</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                                    <option value="VACATION">Vacation</option>
                                    <option value="SICK">Sick Leave</option>
                                    <option value="PERSONAL">Personal</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input type="date" name="startDate" required className="bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input type="date" name="endDate" required className="bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason</label>
                                <Input name="reason" placeholder="Optional" className="bg-background" />
                            </div>
                            <Button type="submit" className="w-full">Submit Request</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-6 mt-2">History</h2>
                <div className="space-y-4 border rounded-xl bg-card border-border/50 p-4">
                    {loading ? <p>Loading...</p> : leaves.length === 0 ? <p className="text-muted-foreground">No leave history.</p> : leaves.map(l => (
                        <div key={l.id} className="p-4 border border-border rounded-lg flex justify-between items-center bg-background/50">
                            <div>
                                <p className="font-semibold text-foreground">{l.type}</p>
                                <p className="text-sm text-muted-foreground">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={l.status === 'APPROVED' ? 'default' : l.status === 'PENDING' ? 'secondary' : 'destructive'}>
                                {l.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
