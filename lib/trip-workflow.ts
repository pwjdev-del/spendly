import { SemanticStatus, getStatusStyles } from "@/lib/design-system";

export type TripStatus =
    | "PLANNING"
    | "ACTIVE"
    | "CLOSED"
    | "APPROVED"
    | "IN_REVIEW"
    | "APPROVED_FOR_PAYMENT"
    | "PAYMENT_SENT"
    | "PAYMENT_RECEIVED";

export interface TripStatusConfig {
    label: string;
    value: TripStatus;
    percentage: number;
    color: SemanticStatus;
    allowedRoles: string[]; // Roles that can TRANSITION TO this status
}

export const TRIP_WORKFLOW: TripStatusConfig[] = [
    // Submitter / Info
    {
        label: "Planning",
        value: "PLANNING",
        percentage: 0,
        color: "info",
        allowedRoles: ["SUBMITTER", "ADMIN", "MEMBER", "APPROVER"],
    },
    {
        label: "Active-WIP",
        value: "ACTIVE",
        percentage: 20,
        color: "info",
        allowedRoles: ["SUBMITTER", "ADMIN", "MEMBER", "APPROVER"],
    },
    {
        label: "Closed",
        value: "CLOSED",
        percentage: 50,
        color: "info",
        allowedRoles: ["SUBMITTER", "ADMIN", "MEMBER"],
    },

    // Approver / Warning
    {
        label: "Approved",
        value: "APPROVED",
        percentage: 60,
        color: "warning",
        allowedRoles: ["APPROVER", "ADMIN"],
    },
    {
        label: "In-Review",
        value: "IN_REVIEW",
        percentage: 75,
        color: "warning",
        allowedRoles: ["APPROVER", "AUDITOR", "ADMIN", "SUBMITTER"], // Submitter can request review
    },

    // Auditor / Success
    {
        label: "Approved for Payment",
        value: "APPROVED_FOR_PAYMENT",
        percentage: 90,
        color: "success",
        allowedRoles: ["AUDITOR", "ADMIN"],
    },
    {
        label: "Payment Sent",
        value: "PAYMENT_SENT",
        percentage: 95,
        color: "success",
        allowedRoles: ["AUDITOR", "ADMIN"],
    },

    // Submitter / Success (Cycle complete)
    {
        label: "Payment Received - Closed",
        value: "PAYMENT_RECEIVED",
        percentage: 100,
        color: "success",
        allowedRoles: ["SUBMITTER", "ADMIN", "MEMBER"],
    },
];

export function getStatusConfig(status: string): TripStatusConfig | undefined {
    return TRIP_WORKFLOW.find((s) => s.value === status);
}

export function getAvailableStatuses(userRole: string): TripStatusConfig[] {
    // Normalize role
    const role = userRole === "MEMBER" ? "SUBMITTER" : userRole;

    return TRIP_WORKFLOW.filter(status => status.allowedRoles.includes(role));
}

export function canAddExpense(status: string): boolean {
    return ["PLANNING", "ACTIVE"].includes(status);
}

export function getBadgeColor(color: SemanticStatus): string {
    const styles = getStatusStyles(color);
    // Combine safe default borders. Original had specific dark variants, DS handles logic?
    // DS uses `bg-success/10` etc. We might want border too.
    return `${styles.bg} ${styles.text} ${styles.border} border`;
}
