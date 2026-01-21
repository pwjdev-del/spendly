"use client"

import { useState } from "react"
import { Check, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createSubscription } from "@/app/actions/subscription"
import { toast } from "sonner"

const POPULAR_APPS = [
    { name: "Netflix", category: "Entertainment", color: "bg-red-500", amount: 15.99 },
    { name: "Spotify", category: "Music", color: "bg-green-500", amount: 10.99 },
    { name: "Amazon Prime", category: "Shopping", color: "bg-blue-400", amount: 14.99 },
    { name: "Youtube Premium", category: "Entertainment", color: "bg-red-600", amount: 13.99 },
    { name: "Apple One", category: "Ecosystem", color: "bg-gray-900 dark:bg-white", amount: 19.95 },
    { name: "ChatGPT Plus", category: "AI", color: "bg-emerald-600", amount: 20.00 },
    { name: "Adobe Creative Cloud", category: "Productivity", color: "bg-red-500", amount: 54.99 },
    { name: "Dropbox", category: "Storage", color: "bg-blue-600", amount: 11.99 },
    { name: "Disney+", category: "Entertainment", color: "bg-blue-900", amount: 13.99 },
    { name: "Hulu", category: "Entertainment", color: "bg-green-400", amount: 7.99 },
    { name: "PlayStation Plus", category: "Gaming", color: "bg-blue-700", amount: 9.99 },
    { name: "Xbox Game Pass", category: "Gaming", color: "bg-green-600", amount: 16.99 },
]

export function SubscriptionWizard() {
    const [selected, setSelected] = useState<string[]>([])
    const [search, setSearch] = useState("")
    const [saving, setSaving] = useState(false)

    const toggleApp = (name: string) => {
        if (selected.includes(name)) {
            setSelected(selected.filter(s => s !== name))
        } else {
            setSelected([...selected, name])
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const appsToSave = POPULAR_APPS.filter(app => selected.includes(app.name))

            // Save all in parallel
            await Promise.all(appsToSave.map(app => createSubscription({
                merchant: app.name,
                amount: app.amount,
                currency: "USD",
                category: app.category,
                frequency: "MONTHLY",
                nextDueDate: new Date() // Default to today, user can edit later
            })))

            toast.success(`added ${appsToSave.length} subscriptions!`)
            setSelected([])
        } catch (error) {
            toast.error("Failed to save subscriptions")
        } finally {
            setSaving(false)
        }
    }

    const filteredApps = POPULAR_APPS.filter(app => app.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search apps (e.g. Netflix)"
                    className="pl-9 bg-secondary/50 border-transparent focus:border-primary/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {filteredApps.map((app) => (
                        <div
                            key={app.name}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
                                selected.includes(app.name)
                                    ? "bg-primary/10 border-primary"
                                    : "bg-card border-border hover:border-primary/30"
                            )}
                            onClick={() => toggleApp(app.name)}
                        >
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm", app.color)}>
                                {app.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{app.name}</p>
                                <p className="text-[10px] text-muted-foreground">{app.category}</p>
                            </div>
                            {selected.includes(app.name) && (
                                <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-in zoom-in">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {selected.length > 0 && (
                <Button
                    className="w-full animate-in slide-in-from-bottom-2 fade-in bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save {selected.length} Subscriptions
                </Button>
            )}
        </div>
    )
}
