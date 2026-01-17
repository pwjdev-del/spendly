export type UserRole = "SUBMITTER" | "DELEGATE" | "APPROVER" | "AUDITOR" | "ADMIN" | "MEMBER";

export const ROLES = {
    SUBMITTER: "SUBMITTER",
    DELEGATE: "DELEGATE",
    APPROVER: "APPROVER",
    AUDITOR: "AUDITOR",
    ADMIN: "ADMIN",
    MEMBER: "MEMBER", // Legacy, treat as SUBMITTER
} as const;

/**
 * Maps legacy roles to new system or normalizes input
 */
export function normalizeRole(role: string): UserRole {
    if (!role) return "SUBMITTER";
    const upper = role.toUpperCase();
    if (upper === "MEMBER") return "SUBMITTER";
    if (Object.values(ROLES).includes(upper as any)) return upper as UserRole;
    return "SUBMITTER"; // Default safety
}

/**
 * Can the user create expenses for themselves?
 * Everyone (Submitter+) can do this.
 */
export function canCreateOwnExpense(role: string): boolean {
    // All roles can submit their own expenses
    return true;
}

/**
 * Can the user create expenses for OTHERS?
 * Only Delegate and Admin.
 */
export function canCreateExpenseForOthers(role: string): boolean {
    const r = normalizeRole(role);
    return r === "DELEGATE" || r === "ADMIN";
}

/**
 * Can the user Approve or Reject expenses?
 * Approver, Auditor, Admin.
 */
export function canApprove(role: string): boolean {
    const r = normalizeRole(role);
    return ["APPROVER", "AUDITOR", "ADMIN"].includes(r);
}

/**
 * Can the user Pay/Reconcile expenses?
 * Auditor, Admin.
 */
export function canReconcile(role: string): boolean {
    const r = normalizeRole(role);
    return ["AUDITOR", "ADMIN"].includes(r);
}

/**
 * Can the user edit accounting codes/metadata?
 * Auditor, Admin.
 */
export function canEditCodes(role: string): boolean {
    const r = normalizeRole(role);
    return ["AUDITOR", "ADMIN"].includes(r);
}

/**
 * Can the user configure system rules/users?
 * Admin only.
 */
export function canManageSystem(role: string): boolean {
    const r = normalizeRole(role);
    return r === "ADMIN";
}
