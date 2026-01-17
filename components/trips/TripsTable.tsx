"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { motion } from "framer-motion"
import { SafeMath } from "@/lib/math"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, ChevronsUpDown, MapPin, LayoutList, LayoutGrid, Plus, Plane } from "lucide-react"
import { DeleteTripButton } from "@/components/trips/DeleteTripButton"
import { getStatusConfig, getBadgeColor } from "@/lib/trip-workflow"

interface Trip {
    id: string
    tripNumber: string
    name: string
    // destination: string // Removed unused field to match data
    startDate: Date
    endDate: Date | null
    status: string
    budget: number | null
    expenses: {
        amount: number
    }[]
}

interface TripsTableProps {
    trips: Trip[]
}

type SortKey = 'name' | 'startDate' | 'status' | 'budget' | 'spent'

function SortIcon({ column, sortKey, sortDirection }: { column: SortKey, sortKey: SortKey, sortDirection: 'asc' | 'desc' }) {
    if (sortKey !== column) return <ChevronsUpDown className="ml-2 h-4 w-4" />
    return sortDirection === 'asc'
        ? <ChevronUp className="ml-2 h-4 w-4" />
        : <ChevronDown className="ml-2 h-4 w-4" />
}

export function TripsTable({ trips: initialTrips }: TripsTableProps) {
    const [view, setView] = useState<'list' | 'block'>('list')
    const [sortKey, setSortKey] = useState<SortKey>('startDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const sortedTrips = [...initialTrips].sort((a, b) => {
        let aValue: any
        let bValue: any

        // Calculate calculated fields for sorting
        const aSpent = a.expenses.reduce((sum, e) => sum + e.amount, 0)
        const bSpent = b.expenses.reduce((sum, e) => sum + e.amount, 0)

        switch (sortKey) {
            case 'spent':
                aValue = aSpent
                bValue = bSpent
                break
            case 'startDate':
                aValue = new Date(a.startDate).getTime()
                bValue = new Date(b.startDate).getTime()
                break
            default:
                // Safe access for keys present in Trip
                aValue = a[sortKey as keyof Trip]
                bValue = b[sortKey as keyof Trip]
        }

        if (aValue === bValue) return 0
        // Handle nulls
        if (aValue === null) return 1
        if (bValue === null) return -1

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    return (
        <div className="space-y-8">
            {/* Main Content Area */}
            <div className="space-y-6">

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        MY TRIPS
                    </h2>
                    <div className="flex items-center gap-3">
                        <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            <Link href="/trips/new">
                                <Plus className="w-4 h-4 mr-2" /> New Trip
                            </Link>
                        </Button>
                        <div className="flex gap-1 bg-white/50 dark:bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                            <Button
                                variant={view === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('list')}
                                className={`rounded-lg px-3 transition-all ${view === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={view === 'block' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('block')}
                                className={`rounded-lg px-3 transition-all ${view === 'block' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {view === 'list' ? (
                    <div className="rounded-xl overflow-x-auto border border-border bg-card">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="py-5"><Button variant="ghost" onClick={() => handleSort('name')} className="font-bold text-foreground">TRIP <SortIcon column="name" sortKey={sortKey} sortDirection={sortDirection} /></Button></TableHead>
                                    <TableHead className="py-5 hidden md:table-cell"><Button variant="ghost" onClick={() => handleSort('startDate')} className="font-bold text-foreground">DATES <SortIcon column="startDate" sortKey={sortKey} sortDirection={sortDirection} /></Button></TableHead>
                                    <TableHead className="py-5"><Button variant="ghost" onClick={() => handleSort('status')} className="font-bold text-foreground">STATUS <SortIcon column="status" sortKey={sortKey} sortDirection={sortDirection} /></Button></TableHead>
                                    <TableHead className="py-5 hidden md:table-cell"><Button variant="ghost" onClick={() => handleSort('budget')} className="font-bold text-foreground">BUDGET <SortIcon column="budget" sortKey={sortKey} sortDirection={sortDirection} /></Button></TableHead>
                                    <TableHead className="py-5 text-right"><Button variant="ghost" onClick={() => handleSort('spent')} className="font-bold text-foreground">SPENT <SortIcon column="spent" sortKey={sortKey} sortDirection={sortDirection} /></Button></TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTrips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-4 opacity-50">
                                                <MapPin className="h-12 w-12" />
                                                <p className="text-lg font-medium">No trips recorded yet</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedTrips.map((trip, index) => {
                                        const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0)
                                        const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0
                                        const isOverBudget = trip.budget && totalSpent > trip.budget

                                        return (
                                            <TableRow
                                                key={trip.id}
                                                className="group border-b border-border hover:bg-muted/50 transition-colors duration-200"
                                            >
                                                <TableCell className="py-4 pl-6">
                                                    <Link href={`/trips/${trip.id}`} className="block">
                                                        <div className="font-bold text-foreground text-lg">{trip.name}</div>
                                                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mt-0.5 opacity-70">#{trip.tripNumber.toString().padStart(4, '0')}</div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Link href={`/trips/${trip.id}`} className="block">
                                                        <div className="text-sm font-medium text-muted-foreground font-mono" suppressHydrationWarning>
                                                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            {trip.endDate && ` → ${new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/trips/${trip.id}`} className="block">
                                                        {(() => {
                                                            const config = getStatusConfig(trip.status)
                                                            const badgeClass = config ? getBadgeColor(config.color) : "bg-muted text-muted-foreground"
                                                            return (
                                                                <Badge variant="outline" className={`${badgeClass} border-0 shadow-sm font-bold px-3`}>
                                                                    {config?.label || trip.status}
                                                                </Badge>
                                                            )
                                                        })()}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell w-1/4">
                                                    <Link href={`/trips/${trip.id}`} className="block">
                                                        {trip.budget ? (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs font-semibold">
                                                                    <span>{Math.round(budgetProgress)}%</span>
                                                                    <span className="text-muted-foreground">${trip.budget.toLocaleString()}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-foreground'}`} style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No budget set</span>
                                                        )}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Link href={`/trips/${trip.id}`} className="block">
                                                        <span className={`font-mono font-bold text-lg ${isOverBudget ? "text-red-500" : "text-foreground"}`}>
                                                            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="pr-4">
                                                    <DeleteTripButton id={trip.id} />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <motion.div
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {sortedTrips.length === 0 ? (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground/40 text-center border-2 border-dashed border-border rounded-xl">
                                <Plane className="h-10 w-10 mb-4 opacity-50" />
                                <p className="text-lg font-medium text-foreground">No trips yet</p>
                                <p className="text-sm">Create your first trip to get started.</p>
                            </div>
                        ) : (
                            sortedTrips.map((trip) => {
                                const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0)
                                const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0
                                const config = getStatusConfig(trip.status)
                                const badgeColorClass = config ? getBadgeColor(config.color) : "bg-muted text-muted-foreground"

                                return (
                                    <motion.div
                                        key={trip.id}
                                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                        className="group"
                                    >
                                        <Link href={`/trips/${trip.id}`} className="block h-full">
                                            <div className="h-full bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col">

                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <Badge variant="outline" className={`${badgeColorClass} border-0 font-semibold px-2.5 py-0.5 rounded-md`}>
                                                            {config?.label || trip.status}
                                                        </Badge>
                                                        <div className="text-[10px] font-mono text-muted-foreground mt-2">
                                                            #{trip.tripNumber.toString().padStart(4, '0')}
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-muted rounded-full text-muted-foreground group-hover:text-primary transition-colors">
                                                        <Plane className="h-4 w-4" />
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                    {trip.name}
                                                </h3>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-6">
                                                    <span className="flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                                        {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <div className="mt-auto space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Spent</div>
                                                            <div className="text-lg font-bold text-foreground tabular-nums">
                                                                ${totalSpent.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        {trip.budget && (
                                                            <div className="text-right">
                                                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Budget</div>
                                                                <div className="text-sm font-medium text-muted-foreground tabular-nums">
                                                                    ${trip.budget.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {trip.budget && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                                                <span>{Math.round(budgetProgress)}% used</span>
                                                            </div>
                                                            <Progress value={budgetProgress} className="h-1.5 bg-muted" indicatorClassName={budgetProgress > 100 ? "bg-red-500" : "bg-foreground"} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })
                        )}
                    </motion.div>
                )}
            </div>

            {/* Floating Action Button (Mobile) */}
            <div className="fixed bottom-8 right-8 z-50 md:hidden">
                <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-300">
                    <Link href="/trips/new">
                        <Plus className="h-6 w-6 text-primary-foreground" />
                    </Link>
                </Button>
            </div>
        </div >
    )
}
