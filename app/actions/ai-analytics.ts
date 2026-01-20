"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Helper for NVIDIA API (AI Analytics uses NVIDIA)
async function callNvidiaAI(prompt: string) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("AI Service Unavailable (NVIDIA_API_KEY missing)");

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "meta/llama-3.3-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            top_p: 1,
            max_tokens: 1024,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
}

// Helper to get start/end of current month
function getMonthBounds() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return { startOfMonth, endOfMonth }
}

// Helper to get 6-month historical data
async function getHistoricalSpending(userId: string) {
    const months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

        const spending = await prisma.expense.aggregate({
            where: {
                userId,
                date: { gte: start, lte: end }
            },
            _sum: { amount: true }
        })

        months.push({
            month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total: (spending._sum.amount || 0) / 100 // Convert cents to dollars
        })
    }

    return months
}

export async function askData(query: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const userId = session.user.id
        const { startOfMonth, endOfMonth } = getMonthBounds()

        // 1. Fetch User with budget info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                monthlyLimit: true,
                organizationId: true
            }
        })

        // 2. Fetch recent expenses (last 100)
        const recentExpenses = await prisma.expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 100,
            select: {
                date: true,
                merchant: true,
                amount: true,
                category: true,
                currency: true,
                tripId: true
            }
        })

        // 3. Fetch trips with expense summaries
        const trips = await prisma.trip.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                tripNumber: true,
                budget: true,
                status: true,
                startDate: true,
                endDate: true,
                expenses: {
                    select: {
                        amount: true,
                        category: true
                    }
                }
            }
        })

        // 4. Calculate current month spending
        const currentMonthSpending = await prisma.expense.aggregate({
            where: {
                userId,
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: { amount: true }
        })

        // 5. Get 6-month historical spending
        const historicalSpending = await getHistoricalSpending(userId)

        // Build compact context objects
        const expenseContext = recentExpenses.map(e => ({
            d: e.date.toISOString().split('T')[0],
            m: e.merchant,
            a: e.amount / 100, // Convert to dollars for easier reading
            c: e.category,
            t: e.tripId || null
        }))

        const tripContext = trips.map(t => ({
            id: t.id,
            name: t.name,
            num: t.tripNumber,
            budget: t.budget,
            status: t.status,
            start: t.startDate.toISOString().split('T')[0],
            end: t.endDate?.toISOString().split('T')[0] || null,
            totalSpent: t.expenses.reduce((sum, e) => sum + e.amount, 0) / 100,
            expenseCount: t.expenses.length
        }))

        const budgetContext = {
            monthlyLimit: user?.monthlyLimit || 5000,
            currentMonthSpent: (currentMonthSpending._sum.amount || 0) / 100,
            remaining: ((user?.monthlyLimit || 5000) - (currentMonthSpending._sum.amount || 0) / 100)
        }

        // Calculate average monthly spending for predictions
        const avgMonthlySpending = historicalSpending.reduce((sum, m) => sum + m.total, 0) / historicalSpending.length

        const prompt = `
You are Penny, a friendly and helpful financial assistant for "Kharcho" expense management app.

User Query: "${query}"

=== YOUR CAPABILITIES ===

1. EXPENSE ANALYSIS - Answer questions about spending, categories, merchants
2. TRIP SUMMARIES - Answer questions about specific trips and their expenses
3. BUDGET TRACKING - Compare current spending to monthly budget limit
4. PREDICTIVE SPENDING - Estimate future spending based on historical patterns
5. EXPENSE CREATION - Help users add new expenses via natural language
6. TASK CREATION - Help users add to-do items/tasks

=== CONTEXT DATA ===

Recent Expenses (last 100, amounts in dollars):
${JSON.stringify(expenseContext)}

Trips (with totals):
${JSON.stringify(tripContext)}

Budget Info:
- Monthly Limit: $${budgetContext.monthlyLimit}
- Spent This Month: $${budgetContext.currentMonthSpent.toFixed(2)}
- Remaining: $${budgetContext.remaining.toFixed(2)}

Historical Monthly Spending (last 6 months):
${JSON.stringify(historicalSpending)}

Average Monthly Spending: $${avgMonthlySpending.toFixed(2)}

=== INSTRUCTIONS ===

1. Answer queries based on the provided data.
2. For trip questions, match by trip name (fuzzy match OK).
3. For budget questions, use the Budget Info section.
4. For predictions, use Historical Monthly Spending and average.
5. Be concise, friendly, and conversational.
6. Do NOT use markdown formatting (no **, no *, no #). Plain text only.
7. If asked to CREATE an expense, respond with ONLY this format:
   [ACTION:CREATE_EXPENSE]{"amount":XX,"merchant":"NAME","category":"CATEGORY"}
   Where amount is in dollars, merchant is the business name, category is one of: Food, Transport, Accommodation, Entertainment, Shopping, Utilities, Health, General

8. If asked to CREATE a task/todo, respond with ONLY this format:
    [ACTION:CREATE_TASK]{"title":"TITLE","priority":X}
    Where title is the task description. Priority is optional (1=Critical, 2=High, 3=Normal, 4=None). Default to 4.

Answer:
`

        const answer = await callNvidiaAI(prompt)
        return { answer }

    } catch (error: any) {
        console.error("AskData Error:", error)
        return { error: "I'm having trouble analyzing your data right now." }
    }
}

// Action to create expense from Penny chat
export async function createExpenseFromPenny(params: {
    amount: number      // In dollars
    merchant: string
    category?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true }
        })

        if (!user?.organizationId) {
            return { error: "User not associated with an organization" }
        }

        // Convert dollars to cents
        const amountInCents = Math.round(params.amount * 100)

        const expense = await prisma.expense.create({
            data: {
                amount: amountInCents,
                merchant: params.merchant,
                category: params.category || "General",
                currency: "USD",
                date: new Date(),
                status: "PENDING",
                userId: session.user.id,
                organizationId: user.organizationId
            }
        })

        revalidatePath("/expenses")
        revalidatePath("/")

        return {
            success: true,
            expense: {
                id: expense.id,
                amount: params.amount,
                merchant: params.merchant,
                category: params.category || "General"
            }
        }
    } catch (error: any) {
        console.error("CreateExpenseFromPenny Error:", error)
        return { error: "Failed to create expense" }
    }
}

// Action to create task from Penny chat
export async function createTaskFromPenny(params: {
    title: string
    priority?: number
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.task.create({
            data: {
                title: params.title,
                priority: params.priority || 4,
                status: "TODO",
                ownerId: session.user.id,
                // We could infer date from title in future, or ask LLM to parse date
            }
        })

        revalidatePath("/todo")

        return { success: true }
    } catch (error: any) {
        console.error("CreateTaskFromPenny Error:", error)
        return { error: "Failed to create task" }
    }
}
