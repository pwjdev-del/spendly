"use client"

import { useState } from "react"
import { TripsTable } from "@/components/trips/TripsTable"
import { SearchBar } from "@/components/search/SearchBar"
import { executeSearch, createSavedSearch } from "@/app/actions/saved-searches"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Trip {
    id: string
    tripNumber: string
    name: string
    startDate: Date
    endDate: Date | null
    status: string
    budget: number | null
    expenses: {
        amount: number
    }[]
}

interface SavedSearch {
    id: string
    name: string
    queryString: string
    isPinned: boolean
    isShared?: boolean
}

interface TripsWithSearchProps {
    initialTrips: Trip[]
    savedSearches: SavedSearch[]
}

export function TripsWithSearch({ initialTrips, savedSearches: initialSavedSearches }: TripsWithSearchProps) {
    const [trips, setTrips] = useState<Trip[]>(initialTrips)
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(initialSavedSearches)
    const [query, setQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery)

        if (!searchQuery.trim()) {
            setTrips(initialTrips)
            return
        }

        setIsSearching(true)
        try {
            const result = await executeSearch(searchQuery, { type: "trip" })
            if (result.errors && result.errors.length > 0) {
                toast.error("Invalid search query", {
                    description: result.errors.join(", ")
                })
                return
            }

            // Cast the result to Trip[] as we know the shape matches thanks to our update
            setTrips(result.results as unknown as Trip[])
        } catch (error) {
            console.error("Search failed:", error)
            toast.error("Search failed", {
                description: "An unexpected error occurred while searching."
            })
        } finally {
            setIsSearching(false)
        }
    }

    const handleSavedSearchSelect = (search: { id: string, queryString: string }) => {
        setQuery(search.queryString)
        handleSearch(search.queryString)
    }

    const handleSaveSearch = async (query: string, name: string) => {
        try {
            const saved = await createSavedSearch({
                name,
                queryString: query,
                typeScope: "TRIP",
                isPinned: false,
                isShared: false
            });

            // Add to local state
            setSavedSearches(prev => [
                {
                    id: saved.id,
                    name: saved.name,
                    queryString: saved.queryString,
                    isPinned: saved.isPinned,
                    isShared: saved.isShared
                },
                ...prev
            ]);

            toast.success("Search saved successfully");
        } catch (error) {
            console.error("Failed to save search:", error);
            toast.error("Failed to save search");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        onSearch={handleSearch}
                        onSave={handleSaveSearch}
                        placeholder="Search trips (e.g. status:approved budget>1000)"
                        savedSearches={savedSearches}
                        onSelectSaved={handleSavedSearchSelect}
                    />
                    {/* Add Export button here or in TripsTable toolbar? 
                        The TripsTable toolbar has "New Trip". 
                        We can keep this separate or integrate. 
                    */}
                </div>
            </div>

            {isSearching ? (
                <div className="flex items-center justify-center h-64 border rounded-xl bg-muted/10">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Searching trips...</p>
                    </div>
                </div>
            ) : (
                <TripsTable trips={trips} />
            )}
        </div>
    )
}
