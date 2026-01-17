"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Button } from "@/components/ui/button"

// Fix for default Leaflet markers in Next.js/Webpack
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface LocationPickerProps {
    initialLat?: number
    initialLng?: number
    onSelect: (lat: number, lng: number) => void
    onCancel: () => void
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })

    return position === null ? null : (
        <Marker position={position} />
    )
}

export default function LocationPicker({ initialLat, initialLng, onSelect, onCancel }: LocationPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(
        initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
    )

    // Default center (NYC if nothing provided)
    const center: [number, number] = initialLat && initialLng
        ? [initialLat, initialLng]
        : [40.7128, -74.0060]

    const handleConfirm = () => {
        if (position) {
            onSelect(position.lat, position.lng)
        }
    }

    return (
        <div className="flex flex-col h-[400px] gap-4">
            <div className="flex-1 rounded-md overflow-hidden border relative z-0">
                <MapContainer
                    center={center}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={!position} type="button">
                    Confirm Location
                </Button>
            </div>
        </div>
    )
}
