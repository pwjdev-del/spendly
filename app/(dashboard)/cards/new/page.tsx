import { issueCard } from "@/app/actions/cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function IssueCardPage() {
    return (
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Issue New Virtual Card</CardTitle>
                    <CardDescription>Create a new virtual card for expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={issueCard} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="nickname">Card Nickname (Optional)</Label>
                            <Input type="text" id="nickname" name="nickname" placeholder="e.g. AWS Subscription" />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="limit">Monthly Limit ($)</Label>
                            <Input type="number" id="limit" name="limit" placeholder="1000.00" step="100" required />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit">Issue Card</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
