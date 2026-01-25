"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTrip, updateTrip } from "@/app/actions/trips"
import { toast } from "sonner"
import { format } from "date-fns"

interface TripFormProps {
    initialData?: {
        id: string
        name: string
        description?: string | null
        startDate: Date
        endDate?: Date | null
        budget?: number | null
        status: string
    }
    isEditing?: boolean
}

export function TripForm({ initialData, isEditing = false }: TripFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<string>(initialData?.status || "PLANNING")

    async function onSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                if (isEditing && initialData) {
                    // Update existing trip
                    const result = await updateTrip(initialData.id, formData)
                    if (result?.error) {
                        toast.error(result.error)
                    } else {
                        toast.success("Trip updated successfully")
                        router.push(`/trips/${initialData.id}`)
                        router.refresh()
                    }
                } else {
                    // Create new trip
                    const result = await createTrip(undefined, formData)
                    if (result === "success") {
                        toast.success("Trip created successfully")
                        router.push("/trips")
                    } else if (typeof result === "string") {
                        toast.error(result)
                    }
                }
            } catch (error) {
                console.error(error)
                toast.error("Something went wrong")
            }
        })
    }

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Trip" : "Trip Details"}</CardTitle>
                <CardDescription>
                    {isEditing ? "Update your trip information" : "Enter the details for your trip"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={onSubmit} className="space-y-6">
                    <div className="grid gap-3">
                        <Label htmlFor="name">Trip Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g., NYC Business Trip"
                            defaultValue={initialData?.name}
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Optional trip description"
                            defaultValue={initialData?.description || ""}
                            rows={3}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <div className="relative">
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    defaultValue={initialData?.startDate ? format(new Date(initialData.startDate), "yyyy-MM-dd") : ""}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                defaultValue={initialData?.endDate ? format(new Date(initialData.endDate), "yyyy-MM-dd") : ""}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="budget">Budget (Optional)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500">$</span>
                                <Input
                                    id="budget"
                                    name="budget"
                                    type="number"
                                    className="pl-7"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    defaultValue={initialData?.budget || ""}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" value={status} onValueChange={setStatus} disabled={isPending}>
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" asChild disabled={isPending}>
                            <Link href={isEditing ? `/trips/${initialData?.id}` : "/trips"}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground min-w-[120px]">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                isEditing ? "Save Changes" : "Create Trip"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
