
import { setTimeout } from "timers/promises";

interface GeocodeResult {
    latitude: number;
    longitude: number;
    displayName: string;
}

// Queue system to respect Nominatim's 1 req/sec limit
let lastRequestTime = 0;
const MIN_DELAY_MS = 1200; // slightly more than 1s to be safe

async function waitPeriod() {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;

    if (timeSinceLast < MIN_DELAY_MS) {
        const delay = MIN_DELAY_MS - timeSinceLast;
        await setTimeout(delay);
    }
    lastRequestTime = Date.now();
}

/**
 * Geocode a location string using OpenStreetMap's Nominatim API.
 * 
 * @param query The location string to search for (e.g. "Eiffel Tower, Paris" or "Starbucks, NYC")
 * @returns Promise<GeocodeResult | null>
 */
export async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
    if (!query || query.trim().length < 3) return null;

    try {
        // Wait for our turn in the queue
        await waitPeriod();

        const params = new URLSearchParams({
            q: query,
            format: "json",
            limit: "1",
            addressdetails: "1",
        });

        // User-Agent is REQUIRED by Nominatim TOS
        // See: https://operations.osmfoundation.org/policies/nominatim/
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: {
                "User-Agent": "SpendlyApp/1.0 (contact@spendly.app)",
                "Accept-Language": "en-US,en;q=0.5"
            },
            next: { revalidate: 3600 } // Cache results for 1 hour
        });

        if (!response.ok) {
            console.warn(`Nominatim geocoding failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }

        return null;

    } catch (error) {
        console.warn("Error calling Nominatim:", error);
        return null; // Fail gracefully, don't crash the app
    }
}
