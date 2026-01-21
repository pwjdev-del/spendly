import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Zap, Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiaStatementScanner } from "./SiaStatementScanner"
import { SubscriptionWizard } from "./SubscriptionWizard"
import { SubscriptionList } from "./SubscriptionList"
import { getSubscriptions } from "@/app/actions/subscription"

export function SubscriptionManager() {
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await getSubscriptions()
            setSubscriptions(data)
        } catch (e) {
            console.error("Failed to load subscriptions", e)
        } finally {
            setLoading(false)
        }
    }
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Discovery Card */}
                <Card className="col-span-2 bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden border-border/50 shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-primary" />
                            <span>Discovery Engine</span>
                        </CardTitle>
                        <CardDescription>Two ways to find your subscriptions.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[500px] p-0">
                        <Tabs defaultValue="wizard" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="wizard">Quick Wizard</TabsTrigger>
                                <TabsTrigger value="scanner">Sia Scanner</TabsTrigger>
                            </TabsList>
                            <TabsContent value="wizard" className="flex-1 mt-0">
                                <SubscriptionWizard />
                            </TabsContent>
                            <TabsContent value="scanner" className="flex-1 mt-0">
                                <SiaStatementScanner />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Dashboard Stats (Placeholder for Bubble Chart) */}
                <Card className="col-span-1 bg-card/50 border-dashed border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="h-32 w-32 rounded-full bg-secondary/50 mb-4 animate-pulse"></div>
                    <p>Visual Bubble Chart Loading...</p>
                </Card>
            </div>

            {/* Main List */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <SubscriptionList subscriptions={subscriptions} />
            )}
        </motion.div>
    )
}
