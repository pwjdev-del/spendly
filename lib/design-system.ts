
/**
 * Kharcho Semantic Design System
 * 
 * This file serves as the source of truth for semantic color usage in the application.
 * It strictly maps to the Tailwind v4 tokens defined in app/globals.css.
 * 
 * Usage:
 * import { DS } from "@/lib/design-system";
 * <div className={DS.tokens.text.success}>Success Message</div>
 */

export const DS = {
    tokens: {
        text: {
            default: "text-foreground",
            muted: "text-muted-foreground",
            success: "text-success",
            warning: "text-warning",
            info: "text-info",
            destructive: "text-destructive",
            primary: "text-primary",
        },
        bg: {
            subtle: {
                success: "bg-success/10",
                warning: "bg-warning/10",
                info: "bg-info/10",
                destructive: "bg-destructive/10",
                primary: "bg-primary/10",
            },
            solid: {
                success: "bg-success",
                warning: "bg-warning",
                info: "bg-info",
                destructive: "bg-destructive",
                primary: "bg-primary",
            }
        },
        border: {
            subtle: {
                success: "border-success/20",
                warning: "border-warning/20",
                info: "border-info/20",
                destructive: "border-destructive/20",
            }
        }
    }
} as const;

export type SemanticStatus = "success" | "warning" | "info" | "destructive";

export function getStatusStyles(status: SemanticStatus) {
    return {
        text: DS.tokens.text[status],
        bg: DS.tokens.bg.subtle[status],
        border: DS.tokens.border.subtle[status]
    };
}
