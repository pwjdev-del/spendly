import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, Trash2 } from "lucide-react"
import prisma from "@/lib/prisma"
import { deleteCard } from "@/app/actions/cards"

import { auth } from "@/auth"

export default async function CardsPage() {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return null

    const cards = await prisma.card.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { user: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Virtual Cards</h1>
                <Button asChild className="self-start md:self-auto">
                    <Link href="/cards/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Issue Card
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cards.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                        No cards issued yet.
                    </div>
                ) : (
                    cards.map((card) => (
                        <div key={card.id} className="relative h-48 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-xl overflow-hidden transition-all hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                                    <CreditCard className="text-gray-900 h-8 w-8" />
                                </div>
                            </div>

                            {/* Delete Button */}
                            <form action={deleteCard} className="absolute top-4 left-4 z-20">
                                <input type="hidden" name="id" value={card.id} />
                                <button type="submit" className="text-white/50 hover:text-white/90 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </button>
                            </form>

                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className="flex justify-between items-start pl-8"> {/* Added padding to avoid overlap with delete button */}
                                    <h3 className="font-semibold text-lg truncate max-w-[140px]">{card.nickname || "General Expense"}</h3>
                                    <span className="font-mono text-sm opacity-80">VISA</span>
                                </div>

                                <div className="font-mono text-xl tracking-wider my-4">
                                    •••• •••• •••• {card.last4}
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs opacity-70 uppercase">Card Holder</div>
                                        <div className="font-medium">{card.user.name || "Employee"}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs opacity-70 uppercase">Limit</div>
                                        <div className="font-medium">${card.limit.toLocaleString()} / mo</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
