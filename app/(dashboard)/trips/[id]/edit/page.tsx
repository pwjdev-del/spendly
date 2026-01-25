import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TripForm } from "@/components/trips/TripForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, organizationId: true }
    })

    if (!user) redirect("/login")

    // Admin Access Check
    if (user.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <h1 className="text-2xl font-bold text-red-500">Unauthorized</h1>
                <p className="text-muted-foreground">Only administrators can edit trips.</p>
                <Button asChild>
                    <Link href={`/trips/${id}`}>Back to Trip</Link>
                </Button>
            </div>
        )
    }

    const trip = await prisma.trip.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            budget: true,
            status: true,
            organizationId: true
        }
    })

    if (!trip) redirect("/trips")

    // Ensure trip belongs to same org
    if (trip.organizationId !== user.organizationId) {
        return <div>Trip not found</div>
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/trips/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Trip</h1>
                    <p className="text-muted-foreground">Update trip details</p>
                </div>
            </div>

            <TripForm
                initialData={{
                    ...trip,
                    // Prisma stores budget in cents, but UI form might expect inputs if not converted in TripForm
                    // Wait, existing createTrip action takes budget as string and defaults to float. 
                    // Let's check the schema. schema says `Int? // Stored in Cents`.
                    // My TripForm expects `number`.
                    // The Create logic: `budget: budget ? parseFloat(budget) : null`.
                    // Wait, if schema says Stored in Cents, `parseFloat` from a text input (e.g. "100.00") is just 100.00.
                    // If DB expects Cents, "100.00" should be stored as 10000.
                    // Let me check `createTrip` in `app/actions/trips.ts`.
                    // Line 54: `budget: budget ? parseFloat(budget) : null`.
                    // Providing a float to an Int field in Prisma usually errors, OR Prisma Client truncates it? 
                    // Actually, if Schema says `Int`, passing 100.50 will fail or be coerced.
                    // If the user meant $100.50, and we pass 100.5, and it stores 100... that's wrong if it's Cents.
                    // If existing code does `parseFloat(budget)`, it might be assuming the Input IS the value.
                    // But looking at schema: `budget Int? // Stored in Cents`.
                    // If I put "50" in input, `parseFloat` gives 50. If I save 50 to DB, it means 50 cents.
                    // Currently `TripCard` does: `const budget = trip.budget || 2000`. `budget` in TripCard is used as dollars?
                    // Let's check `TripCard`: `$(totalSpent / 100).toLocaleString()`. 
                    // `const totalSpent = trip.expenses.reduce...`
                    // Expense amount is `Int // Stored in Cents`.
                    // So totalSpent is sum of cents.
                    // `TripCard` Line 176: `value={'$${(metrics.totalSpent / 100).toLocaleString()}'}`. Correct.
                    // `TripCard` Line 244: `const budget = trip.budget || 2000`.
                    // Line 245: `const progress = Math.min((totalSpent / budget) * 100, 100)`.
                    // If totalSpent is Cents, and budget is Cents, this ratio is correct.
                    // Line 300: `/ ${budget.toLocaleString()}`.
                    // If budget is 50000 (500 dollars), showing "50,000" is wrong if it's meant to be dollars.
                    // Code seems to assume Budget IS Cents.
                    // BUT, `TripCard.tsx:300` shows `${budget.toLocaleString()}`. If budget is 50000, it shows 50,000.
                    // And `metrics.totalSpent / 100` shows dollars.
                    // If `totalSpent` is 5000 cents ($50). And budget is 50000 cents ($500).
                    // `progress` = 5000 / 50000 = 10%. Correct.
                    // But displaying `budget.toLocaleString()` displays 50,000. That looks like $50,000, not $500.
                    // So there is a bug in `TripCard` display of budget?
                    // Or `createTrip` isn't multiplying by 100?
                    // `createTrip`: `budget: budget ? parseFloat(budget) : null`.
                    // If I type "500", it saves 500. Which explains why 500 cents ($5) might look like $500 if displayed raw?
                    // No, `TripCard` displays `budget.toLocaleString()`. 500 -> "500".
                    // But if `totalSpent` is divided by 100...
                    // Let's fix this in my form. I should handle the conversion.
                    // For now, I will assume the `TripForm` should handle "Dollars" and I will multiply/divide by 100 in the Actions?
                    // `createTrip` in `app/actions/trips.ts`: `budget: budget ? parseFloat(budget) : null`.
                    // It does NOT multiply by 100. So it is saving Dollars as Cents? Or is it saving raw int?
                    // Ill stick to the current behavior but I suspect a bug.
                    // However, for the Edit form, I should probably show the raw value from DB for now to avoid confusion, OR divide by 100 if I'm sure.
                    // Let's look at `TripDetailPage`.
                    // `const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0`.
                    // `const isOverBudget = trip.budget && totalSpent > trip.budget`.
                    // `<span>Budget: ${trip.budget.toLocaleString()}</span>`.
                    // If totalSpent is summed from expenses (Cents), and we compare to budget...
                    // If I spend $10 (1000 cents).
                    // If I set budget to 500 (thinking dollars). Saved as 500.
                    // 1000 > 500 -> Over Budget.
                    // So "500" is treated as 500 cents ($5).
                    // So if I type "500", I effectively set a $5 budget.
                    // This confirms I DO need to fix the budget handling to be useful (multiply by 100).
                    // BUT, I should separate that fix or just implement it correctly in my new form.
                    // I will implement "Budget in Dollars" in the UI, and multiply by 100 in the server action.
                    // Wait, `createTrip` is ALREADY THERE. I didn't change it.
                    // I should probably fix `createTrip` and `updateTrip` to handle cent conversion if I want it to work right.
                    // Or maybe the user enters cents? "50000" for $500? That's annoying.
                    // I'll assume standard dollar input.
                    // I will update `app/actions/trips.ts` to multiply by 100.

                    budget: trip.budget ? trip.budget / 100 : undefined
                }}
                isEditing
            />
        </div>
    )
}
