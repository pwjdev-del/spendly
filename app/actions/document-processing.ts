"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Upload a receipt file to storage
 */
export async function uploadReceiptFile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const file = formData.get('file') as File
        if (!file) return { error: "No file provided" }

        // Import storage only on server side
        const { storage } = await import("@/lib/storage")
        const fileUrl = await storage.upload(file, "receipts")

        return { success: true, fileUrl }
    } catch (error) {
        console.error("File upload error:", error)
        return { error: "Failed to upload file" }
    }
}

export interface ProcessedDocument {
    merchant?: string
    amount?: number
    date?: string
    category?: string
    rawText: string
    confidence: number
}

/**
 * Process uploaded document using AI to extract expense data
 * @param fileUrl URL of the uploaded file
 * @param ocrText Extracted text from OCR
 */
export async function processDocumentWithAI(fileUrl: string, ocrText: string): Promise<ProcessedDocument> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        // Use NVIDIA AI to interpret the OCR text
        const apiKey = process.env.NVIDIA_API_KEY
        if (!apiKey) throw new Error("AI Service Unavailable")

        const prompt = `
You are analyzing a receipt or invoice. Extract structured data from this OCR text.

OCR Text:
${ocrText}

Extract the following and respond ONLY with valid JSON:
{
  "merchant": "business name",
  "amount": numeric_value_in_dollars,
  "date": "YYYY-MM-DD format if found",
  "category": "one of: Food, Transport, Accommodation, Entertainment, Shopping, Utilities, Health, General",
  "confidence": 0-100 rating of how confident you are
}

If you cannot find a field, use null. Be precise with the amount.

JSON:
`

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta/llama-3.3-70b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                max_tokens: 256
            })
        })

        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status}`)
        }

        const data = await response.json()
        const aiResponse = data.choices[0]?.message?.content || "{}"

        // Parse AI response
        const parsed = JSON.parse(aiResponse.trim())

        return {
            merchant: parsed.merchant,
            amount: parsed.amount,
            date: parsed.date,
            category: parsed.category || "General",
            rawText: ocrText,
            confidence: parsed.confidence || 50
        }
    } catch (error) {
        console.error("Document processing error:", error)
        // Return raw text if AI processing fails
        return {
            rawText: ocrText,
            confidence: 0
        }
    }
}

/**
 * Create expense from processed document
 */
export async function createExpenseFromDocument(params: {
    merchant: string
    amount: number
    category?: string
    date?: string
    documentUrl: string
    documentId?: string
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

        // Parse date or use current date
        let expenseDate = new Date()
        if (params.date) {
            const parsed = new Date(params.date)
            if (!isNaN(parsed.getTime())) {
                expenseDate = parsed
            }
        }

        const expense = await prisma.expense.create({
            data: {
                amount: amountInCents,
                merchant: params.merchant,
                category: params.category || "General",
                currency: "USD",
                date: expenseDate,
                status: "PENDING",
                receiptUrl: params.documentUrl,
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
        console.error("CreateExpenseFromDocument Error:", error)
        return { error: "Failed to create expense" }
    }
}
