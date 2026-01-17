import { getTrips, getTripById } from "@/app/actions/trips"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import Link from "next/link"

export default async function NewExpensePage({ searchParams }: { searchParams: Promise<{ tripId?: string }> }) {
    const { tripId } = await searchParams
    const trips = await getTrips()

    // Filter to active/planning trips only for dropdown
    const activeTrips = trips.filter(t => t.status !== 'COMPLETED')

    // Get selected trip details if coming from trip page
    const selectedTrip = tripId ? await getTripById(tripId) : null

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
                <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    ← Back to Expenses
                </Link>
            </div>
            <ExpenseForm trips={activeTrips} selectedTrip={selectedTrip} />
        </div>
    )
}
