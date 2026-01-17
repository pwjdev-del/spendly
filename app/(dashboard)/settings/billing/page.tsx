import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, History } from "lucide-react"

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Billing & Subscription</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription plan and billing methods.
                </p>
            </div>
            <div className="border-b" />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Current Plan
                        </CardTitle>
                        <CardDescription>You are currently on the Free plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-2xl font-bold">Free</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Unlimited Expenses</li>
                            <li>Basic Analytics</li>
                            <li>5 Trips</li>
                        </ul>
                        <div className="pt-4">
                            <Button className="w-full">Upgrade to Pro</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing History Stub */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Billing History
                        </CardTitle>
                        <CardDescription>View your past invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex min-h-[150px] items-center justify-center rounded-md border border-dashed bg-muted/50 text-sm text-muted-foreground">
                            No invoices found.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
