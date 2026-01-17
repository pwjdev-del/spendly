"use client";

import { useState, useTransition } from "react";
import { Check, X, FileText, Clock, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { quickApprove, quickReject, quickReconcile } from "@/app/actions/todos";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TodoItem {
    id: string;
    entityType: string;
    entityId: string;
    kind: string;
    priority: number;
    reason: string;
    primaryAction: string;
    title: string;
    amount?: number;
    merchant?: string;
    createdAt: Date;
    age: number;
}

interface TodoListProps {
    todos: TodoItem[];
}

export function TodoList({ todos }: TodoListProps) {
    const router = useRouter();
    const [pending, setPending] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const handlePrimaryAction = async (todo: TodoItem) => {
        setPending((p) => new Set(p).add(todo.id));

        try {
            if (todo.kind === "APPROVE") {
                await quickApprove(todo.entityId);
            } else if (todo.kind === "RECONCILE") {
                await quickReconcile(todo.entityId);
            } else {
                // Navigate to edit page
                router.push(`/${todo.entityType.toLowerCase()}s/${todo.entityId}`);
                return;
            }

            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setPending((p) => {
                const next = new Set(p);
                next.delete(todo.id);
                return next;
            });
        }
    };

    const handleReject = async (todo: TodoItem) => {
        setPending((p) => new Set(p).add(todo.id));

        try {
            await quickReject(todo.entityId);
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error("Reject failed:", error);
        } finally {
            setPending((p) => {
                const next = new Set(p);
                next.delete(todo.id);
                return next;
            });
        }
    };

    if (todos.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Check className="h-12 w-12 mx-auto text-success mb-4" />
                    <h3 className="text-xl font-semibold">All caught up!</h3>
                    <p className="text-muted-foreground mt-2">
                        You have no pending actions right now.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {todos.map((todo) => (
                <Card
                    key={todo.id}
                    className={cn(
                        "transition-all",
                        pending.has(todo.id) && "opacity-50",
                        todo.priority <= 2 && "border-l-4 border-l-warning"
                    )}
                >
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <KindIcon kind={todo.kind} />
                                    <span className="font-medium truncate">{todo.title}</span>
                                    {todo.amount && (
                                        <Badge variant="outline">
                                            ${(todo.amount / 100).toFixed(2)}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {todo.age}d ago
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {todo.entityType}
                                    </Badge>
                                    <span className="truncate">{todo.reason}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {todo.kind === "APPROVE" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReject(todo)}
                                        disabled={pending.has(todo.id)}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Reject
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={() => handlePrimaryAction(todo)}
                                    disabled={pending.has(todo.id)}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    {todo.primaryAction}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function KindIcon({ kind }: { kind: string }) {
    switch (kind) {
        case "APPROVE":
            return <Check className="h-4 w-4 text-success" />;
        case "RECONCILE":
            return <DollarSign className="h-4 w-4 text-info" />;
        case "FIX_RECEIPT":
            return <FileText className="h-4 w-4 text-warning" />;
        case "RECATEGORIZE":
            return <AlertCircle className="h-4 w-4 text-warning" />;
        default:
            return <Clock className="h-4 w-4" />;
    }
}
