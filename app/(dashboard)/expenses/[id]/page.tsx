import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DiscussionPanel } from "@/components/discussions/DiscussionPanel";
import { ArrowLeft, Calendar, CreditCard, FileText, MapPin, Plane, User } from "lucide-react";
import Link from "next/link";
import { SafeMath } from "@/lib/math";
import { Separator } from "@/components/ui/separator";

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return null;

    const expense = await prisma.expense.findUnique({
        where: { id },
        include: {
            user: true,
            trip: true,
        },
    });

    if (!expense) {
        notFound();
    }

    // Check permissions (basic check: owner or admin)
    const isOwner = expense.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    // In a real app, you might want stricter checks here, using permission helpers
    if (!isOwner && !isAdmin && expense.organizationId !== session.user.organizationId) {
        // Simple organization boundary check
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header / Back Link */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/expenses">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expense Details</h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage expense information
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Expense Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant={
                                        expense.status === 'APPROVED' ? 'default' :
                                            expense.status === 'REJECTED' ? 'destructive' : 'secondary'
                                    } className="mb-2">
                                        {expense.status}
                                    </Badge>
                                    <CardTitle className="text-3xl font-bold">
                                        {SafeMath.format(expense.amount, expense.currency)}
                                    </CardTitle>
                                    <CardDescription className="text-lg font-medium text-foreground mt-1">
                                        {expense.merchant}
                                    </CardDescription>
                                </div>
                                {expense.receiptUrl && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Receipt
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Date
                                    </div>
                                    <div className="font-medium">
                                        {format(new Date(expense.date), "PPP")}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" /> Category
                                    </div>
                                    <div className="font-medium">
                                        {expense.category}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" /> Submitted By
                                    </div>
                                    <div className="font-medium">
                                        {expense.user.name || expense.user.email}
                                    </div>
                                </div>
                                {expense.trip && (
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Plane className="h-4 w-4" /> Associated Trip
                                        </div>
                                        <Link href={`/trips/${expense.trip.id}`} className="font-medium text-primary hover:underline block truncate">
                                            {expense.trip.name}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {expense.locationName && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Location
                                        </div>
                                        <div>
                                            {expense.locationName}
                                            {expense.latitude && expense.longitude && (
                                                <div className="text-xs text-muted-foreground mt-1 font-mono">
                                                    {expense.latitude.toFixed(6)}, {expense.longitude.toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Receipt Image Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5" /> Receipt
                                </CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/expenses/${expense.id}/edit`}>
                                        Edit Expense
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {expense.receiptUrl ? (
                                <div className="relative rounded-lg overflow-hidden border bg-muted/30 min-h-[300px] flex items-center justify-center">
                                    {expense.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={`${expense.receiptUrl}#view=FitH`}
                                            className="w-full h-[500px]"
                                            title="Receipt PDF"
                                        />
                                    ) : (
                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                                            <img
                                                src={expense.receiptUrl}
                                                alt="Receipt"
                                                className="w-full h-auto max-h-[500px] object-contain"
                                            />
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg bg-muted/30 text-muted-foreground">
                                    <FileText className="h-12 w-12 mb-2 opacity-50" />
                                    <p>No receipt attached</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Discussions */}
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Discussion</CardTitle>
                            <CardDescription>
                                Comments and notes about this expense
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 min-h-[400px]">
                            <DiscussionPanel
                                entityType="EXPENSE"
                                entityId={expense.id}
                                currentUserId={session.user.id}
                                title={`Discussion for expense at ${expense.merchant}`}
                                scrollAreaClassName="h-[500px]"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
