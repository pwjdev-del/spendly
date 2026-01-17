/**
 * Relative Date Parser - Converts relative date strings to Date objects
 */

import { isRelativeDate, type RelativeDate } from "./operators";

export interface DateRange {
    gte?: Date;
    lte?: Date;
    eq?: Date;
}

/**
 * Parse a relative date string into a Date range for Prisma queries
 */
export function parseRelativeDate(value: string): DateRange | null {
    if (!isRelativeDate(value)) {
        // Try parsing as ISO date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return { eq: date };
        }
        return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (value) {
        case "today": {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return { gte: today, lte: tomorrow };
        }

        case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { gte: yesterday, lte: today };
        }

        case "this-week": {
            const weekStart = new Date(today);
            const day = weekStart.getDay();
            weekStart.setDate(weekStart.getDate() - day); // Start of week (Sunday)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return { gte: weekStart, lte: weekEnd };
        }

        case "last-week": {
            const lastWeekEnd = new Date(today);
            const day = lastWeekEnd.getDay();
            lastWeekEnd.setDate(lastWeekEnd.getDate() - day); // Start of this week
            const lastWeekStart = new Date(lastWeekEnd);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            return { gte: lastWeekStart, lte: lastWeekEnd };
        }

        case "this-month": {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            return { gte: monthStart, lte: monthEnd };
        }

        case "last-month": {
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
            return { gte: lastMonthStart, lte: lastMonthEnd };
        }

        case "last-7-days": {
            const start = new Date(today);
            start.setDate(start.getDate() - 7);
            return { gte: start, lte: now };
        }

        case "last-30-days": {
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            return { gte: start, lte: now };
        }

        case "last-90-days": {
            const start = new Date(today);
            start.setDate(start.getDate() - 90);
            return { gte: start, lte: now };
        }

        case "this-quarter": {
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 1);
            return { gte: quarterStart, lte: quarterEnd };
        }

        case "this-year": {
            const yearStart = new Date(today.getFullYear(), 0, 1);
            const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
            return { gte: yearStart, lte: yearEnd };
        }

        default:
            return null;
    }
}
