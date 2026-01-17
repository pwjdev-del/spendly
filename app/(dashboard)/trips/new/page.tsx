"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTrip } from "@/app/actions/trips"
import { useFormStatus } from "react-dom"
import { useOffline } from "@/components/providers/OfflineSyncProvider"
import { toast } from "sonner"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating..." : "Create Trip"}
        </Button>
    )
}

export default function NewTripPage() {
    const [message, dispatch] = useActionState(createTrip, undefined)
    const { isOnline, saveTripOffline } = useOffline()
    const router = useRouter()

    useEffect(() => {
        if (message === "success") {
            router.push("/trips")
        }
    }, [message, router])

    const handleSubmit = async (formData: FormData) => {
        if (!isOnline) {
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const startDate = new Date(formData.get('startDate') as string)

            const endDateVal = formData.get('endDate')
            const endDate = endDateVal ? new Date(endDateVal as string) : undefined

            const budgetVal = formData.get('budget')
            const budget = budgetVal ? parseFloat(budgetVal as string) : undefined

            const status = formData.get('status') as 'PLANNING' | 'ACTIVE' | 'COMPLETED'

            await saveTripOffline({
                name,
                description,
                startDate,
                endDate,
                budget,
                status
            })

            router.push("/trips") // Optimistic navigation
            return
        }
        return dispatch(formData)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/trips">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Trip</h1>
                    <p className="text-muted-foreground">Add a new trip to track expenses</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                    <CardDescription>Enter the details for your trip</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Trip Name *</Label>
                            {/* ... inputs ... */}
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., NYC Business Trip"
                                required
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Optional trip description"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="budget">Budget (Optional)</Label>
                                <Input
                                    id="budget"
                                    name="budget"
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue="PLANNING">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PLANNING">Planning</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {message && message !== "success" && (
                            <div className="text-sm text-red-500">{message}</div>
                        )}

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
