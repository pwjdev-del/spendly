"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Map, MapPin } from "lucide-react"

// Dynamic import for the MapView to avoid SSR issues with Leaflet/Window
const MapView = dynamic(() => import("@/components/ui/map-view"), {
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-xl">
            <MapPin className="h-8 w-8 text-muted-foreground/30" />
        </div>
    ),
    ssr: false
})

interface DashboardData {
    recentExpenses: any[]
}

export function SpendingMapWidget({ data }: { data: DashboardData }) {
    return (
        <Card className="h-full col-span-full min-h-[250px] flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Spending Map
                </CardTitle>
                <CardDescription>
                    Explore your transactions by location
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
                {/* Map takes full remaining height */}
                <div className="absolute inset-0 top-0 bottom-0 left-0 right-0">
                    <MapView expenses={data.recentExpenses} />
                </div>
            </CardContent>
        </Card>
    )
}
