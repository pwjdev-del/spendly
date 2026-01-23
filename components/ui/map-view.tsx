"use client"

import { useEffect, useState, useRef } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin } from "lucide-react"

// Custom marker with dynamic color
const createCustomIcon = (status: string = "PENDING") => {
    let color = "#F59E0B"; // Default Pending (Orange)

    if (status === "APPROVED") color = "#2DD4BF"; // Teal
    else if (status === "REJECTED") color = "#EF4444"; // Red
    else if (status === "RECONCILED") color = "#3B82F6"; // Blue

    return L.divIcon({
        className: "bg-transparent border-none",
        html: `<div class="w-5 h-5 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style="background-color: ${color};">
                <div class="w-1.5 h-1.5 bg-[#0A1628] rounded-full"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10], // Center it
        popupAnchor: [0, -12]
    })
}

interface MapViewProps {
    expenses: Array<{
        id: string
        merchant: string
        amount: number
        date?: Date | string
        latitude?: number | null
        longitude?: number | null
        category?: string
        status?: string
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

        // 3. Add Tile Layer (CartoDB Voyager - Clean, Premium look)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }).addTo(map)

        // 4. Add Markers
        if (validExpenses.length > 0) {
            const bounds = L.latLngBounds([])

            validExpenses.forEach(expense => {
                if (expense.latitude && expense.longitude) {
                    const marker = L.marker([expense.latitude, expense.longitude], {
                        icon: createCustomIcon(expense.status)
                    })
                        .addTo(map)
                        .bindPopup(`
                            <div class="p-1 font-sans min-w-[150px]">
                                <div class="font-bold text-sm mb-1">${expense.merchant}</div>
                                <div class="flex items-center justify-between gap-2">
                                     <span class="text-xs font-medium px-1.5 py-0.5 rounded-full ${expense.status === 'APPROVED' ? 'bg-teal-100 text-teal-700' :
                                expense.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                            }">${expense.status || 'PENDING'}</span>
                                     <span class="text-sm font-bold">$${(expense.amount / 100).toFixed(2)}</span>
                                </div>
                                <div class="text-xs text-muted-foreground mt-1">${expense.category || ''}</div>
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
