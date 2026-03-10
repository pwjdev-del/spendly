import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession, unauthorizedResponse } from "@/lib/mobile-auth";
import { z } from "zod";

export const runtime = "nodejs";

const createExpenseSchema = z.object({
    amount: z.number().positive(),
    merchant: z.string().min(1),
    category: z.string().min(1),
    date: z.string().datetime().optional(),
    receiptUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
    try {
        const session = getMobileSession(req);
        if (!session || !session.id) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const expenses = await prisma.expense.findMany({
            where: { userId: session.id },
            orderBy: { date: "desc" },
            take: limit,
            include: {
                category: false, // Since it's a string, no relation needed
            }
        });

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error("Mobile GET Expenses Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = getMobileSession(req);
        if (!session || !session.id) return unauthorizedResponse();

        if (!session.organizationId) {
            return NextResponse.json(
                { error: "User does not belong to an organization" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const parsed = createExpenseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid expense data format" },
                { status: 400 }
            );
        }

        const { amount, merchant, category, date, receiptUrl } = parsed.data;

        const newExpense = await prisma.expense.create({
            data: {
                amount: Math.round(amount * 100), // Assuming frontend sends dollars
                merchant,
                category,
                date: date ? new Date(date) : new Date(),
                receiptUrl,
                userId: session.id,
                organizationId: session.organizationId,
                status: "PENDING",
                reconciliationStatus: "UNRECONCILED",
            },
        });

        return NextResponse.json({ expense: newExpense }, { status: 201 });
    } catch (error) {
        console.error("Mobile POST Expense Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
