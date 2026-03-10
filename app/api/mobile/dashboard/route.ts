import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession, unauthorizedResponse } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = getMobileSession(req);
        if (!session || !session.id) return unauthorizedResponse();

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get current month's expenses
        const expenses = await prisma.expense.findMany({
            where: {
                userId: session.id,
                date: { gte: firstDayOfMonth },
            },
            select: { amount: true, status: true },
        });

        const totalSpentThisMonth = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const pendingCount = expenses.filter(e => e.status === "PENDING").length;

        // Get recent transactions (top 5 expenses)
        const recentActivity = await prisma.expense.findMany({
            where: { userId: session.id },
            orderBy: { date: "desc" },
            take: 5,
        });

        return NextResponse.json({
            totalSpentThisMonth: totalSpentThisMonth / 100, // Return as dollars
            pendingCount,
            recentActivity,
        });
    } catch (error) {
        console.error("Mobile GET Dashboard Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
