import { Resend } from 'resend';

// Only initialize if key is present to avoid crash on import
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Kharcho App <onboarding@resend.dev>';

export async function sendReceiptRequestEmail(to: string, items: { date: Date, merchant: string, amount: number }[]) {
    if (!resend) {
        console.warn("RESEND_API_KEY is missing. Skipping email send.");
        console.log(`[MOCK EMAIL] To: ${to}, Subject: Missing Receipts`, items);
        return;
    }

    const itemsList = items.map(item =>
        `<li>${item.date.toLocaleDateString()} - ${item.merchant}: $${item.amount.toFixed(2)}</li>`
    ).join('');

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: to,
            subject: 'Action Required: Missing Receipts',
            html: `
            <h2>Missing Receipts Detected</h2>
            <p>Please upload receipts for the following transaction(s):</p>
            <ul>
                ${itemsList}
            </ul>
            <p>You can upload them directly in the Kharcho Dashboard.</p>
        `
        });
    } catch (error) {
        console.error("Failed to send Receipt Request Email:", error);
    }
}

export async function sendTripReportEmail(to: string, items: { date: Date, merchant: string, amount: number }[], tripName: string, isRev2: boolean) {
    if (!resend) {
        console.warn("RESEND_API_KEY is missing. Skipping email send.");
        console.log(`[MOCK EMAIL] To: ${to}, Subject: Trip Report Update`, items);
        return;
    }

    const itemsList = items.map(item =>
        `<li>${item.date.toLocaleDateString()} - ${item.merchant}: $${item.amount.toFixed(2)}</li>`
    ).join('');

    const subject = isRev2
        ? `Action Required: Add items to ${tripName} (REV-2)`
        : `Action Required: Add items to ${tripName}`;

    const instructions = isRev2
        ? `<p><strong>Note:</strong> The trip report "<strong>${tripName}</strong>" is already closed/completed. Please create a new report named "<strong>${tripName} - REV 2</strong>" and add these items there.</p>`
        : `<p>Please add the following items to the "<strong>${tripName}</strong>" trip report:</p>`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: to,
            subject: subject,
            html: `
            <h2>Trip Report Update Required</h2>
            ${instructions}
            <ul>
                ${itemsList}
            </ul>
            <p>Thank you!</p>
        `
        });
    } catch (error) {
        console.error("Failed to send Trip Report Email:", error);
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    if (!resend) {
        console.warn("RESEND_API_KEY is missing. Skipping email send.");
        return;
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Welcome to Kharcho!",
            html: `<p>Hi ${name}, welcome to Kharcho! We are excited to have you on board.</p>`
        });
    } catch (error) {
        console.error("Failed to send Welcome Email:", error);
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    if (!resend) {
        console.warn("RESEND_API_KEY is missing. Skipping email send.");
        return;
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Reset your password",
            html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
        });
    } catch (error) {
        console.error("Failed to send Password Reset Email:", error);
    }
}
