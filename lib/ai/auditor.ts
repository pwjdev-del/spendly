import { parseReceiptImageWithLlama } from "./nvidia-ocr";
import prisma from "@/lib/prisma";

/**
 * The "Privacy-First AI Auditor" service types
 */
interface EmailReceipt {
    id: string;
    sender: string;
    subject: string;
    date: Date;
    bodyPreview: string;
    attachments?: { url: string; contentType: string }[];
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
}

/**
 * Mock Service for Email Scanning (Gmail/Outlook)
 * In production, this would use the Google Gmail API / Microsoft Graph API
 */
export async function scanInboxForReceipts(userId: string): Promise<EmailReceipt[]> {
    // Mock implementations for demo plan - The user wants integrations, 
    // but we can't "actually" OAuth into their Gmail right now without keys.
    // We will scaffold the logic.
    console.log(`[AI Auditor] Scanning inbox for user ${userId}...`);
    return [];
}

/**
 * Mock Service for Calendar Matching (Google/Apple)
 */
export async function matchCalendarEvents(userId: string, expenseDate: Date): Promise<CalendarEvent | null> {
    console.log(`[AI Auditor] Checking calendar for date ${expenseDate}...`);
    return null;
}

/**
 * Core Logic: The "AI Auditor"
 * Scans for orphaned receipts and matches them to expenses, or creates new ones.
 */
export async function runAiAudit(userId: string) {
    console.log("Running AI Audit Cycle...");

    // 1. Scan Emails
    const recentEmails = await scanInboxForReceipts(userId);

    // 2. Process findings
    for (const email of recentEmails) {
        // If we find an attachment looks like a receipt...
        if (email.attachments?.length) {
            const receiptUrl = email.attachments[0].url;

            // Use our LLaMA Vision
            const data = await parseReceiptImageWithLlama(receiptUrl);

            if (data.amount && data.merchant) {
                // Check if expense exists
                const existing = await prisma.expense.findFirst({
                    where: {
                        userId,
                        amount: Math.round(data.amount * 100), // fuzzy match needed in reality
                        merchant: { contains: data.merchant }
                    }
                });

                if (existing) {
                    console.log(`Matched email receipt to expense ${existing.id}`);
                    // Link it
                    await prisma.expense.update({
                        where: { id: existing.id },
                        data: { receiptUrl: receiptUrl }
                    });
                } else {
                    console.log("Found new potential expense!");
                    // Create "Pending Approval" expense
                    // To implement later
                }
            }
        }
    }
}
