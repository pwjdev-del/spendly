"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Calendar, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTask, parseTaskInput } from "@/app/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskInputProps {
    listId?: string;
    placeholder?: string;
}

export function TaskInput({ listId, placeholder = "Add a task... (e.g., 'Pay rent tomorrow !!p1')" }: TaskInputProps) {
    const [title, setTitle] = useState("");
    const [isPending, startTransition] = useTransition();
    const [parsedPreview, setParsedPreview] = useState<{ date: Date | null, priority: number } | null>(null);

    const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitle(value);

        // Simple client-side preview of parsing (could debounce this if needed)
        // For now, we just check for !!p flags and rudimentary date hints if we wanted
        if (value.includes("!!p")) {
            let p = 4;
            if (value.includes("!!p1")) p = 1;
            else if (value.includes("!!p2")) p = 2;
            else if (value.includes("!!p3")) p = 3;
            setParsedPreview(prev => ({ ...prev, date: prev?.date || null, priority: p }));
        } else {
            setParsedPreview(prev => ({ ...prev, date: prev?.date || null, priority: 4 }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append("title", title);
            if (listId) formData.append("listId", listId);

            try {
                await createTask(formData);
                setTitle("");
                setParsedPreview(null);
                toast.success("Task added");
            } catch (error) {
                toast.error("Failed to create task");
            }
        });
    };

    return (
        <div className="relative group">
            <div className="relative flex items-center">
                <Input
                    value={title}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pr-24 py-6 text-base shadow-sm border-2 focus-visible:ring-0 focus-visible:border-primary/50 transition-all rounded-xl"
                    disabled={isPending}
                />

                <div className="absolute right-2 flex items-center gap-1">
                    {parsedPreview?.priority !== 4 && parsedPreview?.priority && (
                        <Flag className={cn(
                            "h-4 w-4",
                            parsedPreview.priority === 1 ? "text-red-500 fill-red-500" :
                                parsedPreview.priority === 2 ? "text-orange-500 fill-orange-500" :
                                    "text-blue-500 fill-blue-500"
                        )} />
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleSubmit}
                        disabled={!title.trim() || isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            <div className="absolute top-full left-0 w-full mt-2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none px-2">
                <p className="text-xs text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1"><Flag className="h-3 w-3" /> Type <b>!!p1</b>, <b>!!p2</b> for priority</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Type <b>tomorrow</b>, <b>next fri</b> for dates</span>
                </p>
            </div>
        </div>
    );
}
