"use client"

import { TripForm } from "@/components/trips/TripForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewTripPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
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

            <TripForm />
        </div>
    )
}
