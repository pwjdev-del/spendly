"use client"

import { updatePayoutDay } from "@/app/actions/income"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStatus } from "react-dom"

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending}>
            {pending ? "Saving..." : "Save Payout Day"}
        </Button>
    )
}

export default function PayoutSettingsPage() {
    return (
        <div className="max-w-xl">
            <Card>
                <CardHeader>
                    <CardTitle>Payout Schedule</CardTitle>
                    <CardDescription>
                        Set the day of the month you typically receive your funds.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updatePayoutDay} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="day">Day of Month (1-31)</Label>
                            <Input
                                id="day"
                                name="day"
                                type="number"
                                min="1"
                                max="31"
                                placeholder="15"
                                required
                            />
                        </div>
                        <SaveButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
