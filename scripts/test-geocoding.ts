
import { geocodeWithNominatim } from "../lib/geocoding";

async function test() {
    console.log("Testing Nominatim Geocoding...");

    const locations = [
        "Eiffel Tower, Paris",
        "Statue of Liberty, NY",
        "Taj Mahal, Agra" // Testing queue (3 requests)
    ];

    for (const loc of locations) {
        console.log(`Geocoding: ${loc}...`);
        const start = Date.now();
        const result = await geocodeWithNominatim(loc);
        const duration = Date.now() - start;

        if (result) {
            console.log(`✅ Found: ${result.displayName.substring(0, 40)}... (${result.latitude}, ${result.longitude}) in ${duration}ms`);
        } else {
            console.log(`❌ Failed to find: ${loc}`);
        }
    }
}

test().catch(console.error);
