"use client"

import { useEffect, useState, useRef } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin } from "lucide-react"

// Custom marker matching Stitch "Cyan/Teal" theme
const createCustomIcon = () => L.divIcon({
    className: "bg-transparent border-none",
    html: `<div class="w-5 h-5 bg-[#2DD4BF] rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-[#0A1628] rounded-full"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Center it
    popupAnchor: [0, -12]
})

interface MapViewProps {
    expenses: Array<{
        id: string
        merchant: string
        amount: number
        date?: Date | string
        latitude?: number | null
        longitude?: number | null
        category?: string
    }>
}


export default function MapView({ expenses }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)

    // Filter expenses with valid coordinates
    const validExpenses = expenses.filter(e => e.latitude && e.longitude)

    useEffect(() => {
        // Safety check if component is unmounted or ref missing
        if (!mapContainerRef.current) return

        // 1. Cleanup existing map if it somehow exists (Strict Mode safety)
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        // 2. Initialize Map
        const map = L.map(mapContainerRef.current, {
            zoom: 13,
            scrollWheelZoom: false,
            center: [0, 0]
        })
        mapInstanceRef.current = map

        // 3. Add Tile Layer (Esri World Imagery - Satellite)
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 19
        }).addTo(map)

        // 4. Add Markers
        if (validExpenses.length > 0) {
            const bounds = L.latLngBounds([])

            validExpenses.forEach(expense => {
                if (expense.latitude && expense.longitude) {
                    const marker = L.marker([expense.latitude, expense.longitude], { icon: createCustomIcon() })
                        .addTo(map)
                        .bindPopup(`
                            <div class="p-1 font-sans">
                                <div class="font-bold text-sm">${expense.merchant}</div>
                                <div className="text-lg font-bold text-primary">$${(expense.amount / 100).toFixed(2)}</div>
                                <div class="text-xs text-muted-foreground">${expense.category || ''}</div>
                                ${expense.date ? `<div class="text-xs text-muted-foreground border-t mt-1 pt-1">${new Date(expense.date).toLocaleDateString()}</div>` : ''}
                            </div>
                        `)

                    bounds.extend([expense.latitude, expense.longitude])
                }
            })

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] })
            }
        }

        // 5. Setup Resize Observer manually
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize()
        })
        resizeObserver.observe(mapContainerRef.current)

        // Cleanup function
        return () => {
            resizeObserver.disconnect()
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [expenses]) // Re-run if expenses change

    if (validExpenses.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-muted/20 p-6 text-center text-muted-foreground rounded-xl border border-dashed">
                <MapPin className="h-10 w-10 opacity-20 mb-2" />
                <p>No location data found in recent expenses.</p>
                <p className="text-xs mt-1">Try using the camera scan to capture location.</p>
            </div>
        )
    }

    return (
        <div ref={mapContainerRef} className="h-full w-full rounded-xl z-0 bg-muted/10 relative" />
    )
}
