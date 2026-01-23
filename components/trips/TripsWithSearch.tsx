"use client"

import { useState, useMemo } from "react"
import { SearchBar } from "@/components/search/SearchBar"
import { executeSearch, createSavedSearch } from "@/app/actions/saved-searches"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Loader2, Plus, MapPin, Calendar as CalendarIcon, DollarSign, Users, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    destination?: string
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
    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL')

    // derived metrics
    const metrics = useMemo(() => {
        const activeCount = trips.filter(t => t.status === 'ACTIVE').length
        const upcomingCount = trips.filter(t => new Date(t.startDate) > new Date()).length
        const totalSpent = trips.reduce((acc, t) => {
            const tripSpent = t.expenses.reduce((sum, e) => sum + e.amount, 0)
            return acc + tripSpent
        }, 0)
        return { activeCount, upcomingCount, totalSpent }
    }, [trips])

    const filteredTrips = useMemo(() => {
        let filtered = trips
        if (activeTab === 'ACTIVE') filtered = trips.filter(t => t.status === 'ACTIVE')
        if (activeTab === 'UPCOMING') filtered = trips.filter(t => new Date(t.startDate) > new Date())
        if (activeTab === 'COMPLETED') filtered = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CLOSED')
        return filtered
    }, [trips, activeTab])


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
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Trips</h1>
                    <p className="text-muted-foreground mt-1">Track and manage your business trips</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-[300px]">
                        <SearchBar
                            value={query}
                            onChange={setQuery}
                            onSearch={handleSearch}
                            onSave={handleSaveSearch}
                            placeholder="Search trips..."
                            savedSearches={savedSearches}
                            onSelectSaved={handleSavedSearchSelect}
                        />
                    </div>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg border-0 h-10 px-6 rounded-xl font-semibold transition-all hover:scale-105" asChild>
                        <Link href="/trips/new">
                            <Plus className="mr-2 h-4 w-4" /> Create New Trip
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="Active Trips"
                    value={metrics.activeCount.toString()}
                    titleColor="text-emerald-500"
                    icon={MapPin}
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-500"
                />
                <MetricCard
                    label="Upcoming"
                    value={metrics.upcomingCount.toString()}
                    titleColor="text-indigo-400"
                    icon={CalendarIcon}
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard
                    label="Total Spent"
                    value={`$${(metrics.totalSpent / 100).toLocaleString()}`}
                    titleColor="text-sky-400"
                    icon={DollarSign}
                    iconBg="bg-sky-500/10"
                    iconColor="text-sky-400"
                />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-card rounded-xl w-fit border border-border">
                {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === tab
                                ? "bg-secondary text-primary shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {isSearching ? (
                <div className="flex items-center justify-center h-64 border border-border rounded-2xl bg-card">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Searching trips...</p>
                    </div>
                </div>
            ) : filteredTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-2xl bg-card text-muted-foreground">
                    <MapPin className="h-10 w-10 mb-4 opacity-20" />
                    <p>No trips found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTrips.map(trip => (
                        <TripCard key={trip.id} trip={trip} />
                    ))}
                </div>
            )}
        </div>
    )
}

function MetricCard({ label, value, titleColor = "text-foreground", icon: Icon, iconBg, iconColor }: any) {
    return (
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
                    <h3 className={cn("text-3xl font-bold tracking-tight", titleColor)}>{value}</h3>
                </div>
                <div className={cn("p-4 rounded-2xl", iconBg)}>
                    <Icon className={cn("h-6 w-6", iconColor)} />
                </div>
            </CardContent>
        </Card>
    )
}

function TripCard({ trip }: { trip: Trip }) {
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0) / 100
    const budget = trip.budget || 2000 // Mock default if null
    const progress = Math.min((totalSpent / budget) * 100, 100)

    // Determine status color
    const isUpcoming = new Date(trip.startDate) > new Date()
    const isActive = trip.status === 'ACTIVE'

    const statusColor = isActive ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
        isUpcoming ? "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" :
            "text-slate-400 bg-slate-400/10 border-slate-400/20"

    const IconBg = isActive ? "bg-emerald-500/10 text-emerald-500" :
        isUpcoming ? "bg-indigo-500/10 text-indigo-400" :
            "bg-slate-500/10 text-slate-400"

    return (
        <Card className="bg-card border-border shadow-sm group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", IconBg)}>
                            <MapPin className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{trip.name}</h3>
                            <p className="text-sm text-muted-foreground">{trip.destination || "Unknown Destination"}</p>
                        </div>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", statusColor)}>
                        {isActive ? 'Active' : isUpcoming ? 'Upcoming' : trip.status}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            <CalendarIcon className="h-3.5 w-3.5" /> Date range
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -
                            {trip.endDate ? new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            <Users className="h-3.5 w-3.5" /> Travelers
                        </div>
                        <p className="text-sm font-medium text-foreground">1 person</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-muted-foreground">Budget Usage</span>
                        <div className="text-right">
                            <span className="text-sm font-bold text-foreground">${totalSpent.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground"> / ${budget.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">${Math.max(0, budget - totalSpent).toLocaleString()} remaining</span>
                        <span className="text-sky-400 font-bold">{Math.round(progress)}%</span>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
                    <Link href={`/trips/${trip.id}`} className="text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
                        View Details <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Button variant="outline" size="sm" className="border-border hover:bg-secondary" asChild>
                        <Link href={`/expenses/new?tripId=${trip.id}`}>
                            <Plus className="mr-2 h-3.5 w-3.5" /> Add Expense
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
