import { getTrips } from "@/app/actions/trips"
import { getSavedSearches } from "@/app/actions/saved-searches"
import { TripsWithSearch } from "@/components/trips/TripsWithSearch"

export default async function TripsPage() {
    // Parallel fetch for simplified data loading
    const [trips, savedSearches] = await Promise.all([
        getTrips(),
        getSavedSearches("TRIP")
    ])

    return (
        <div className="h-full">
            <TripsWithSearch
                initialTrips={trips}
                savedSearches={savedSearches.map(s => ({
                    id: s.id,
                    name: s.name,
                    queryString: s.queryString,
                    isPinned: s.isPinned
                }))}
            />
        </div>
    )
}
