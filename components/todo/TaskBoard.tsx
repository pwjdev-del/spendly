"use client";

import { useMemo } from "react";
import { Task } from "@prisma/client"; // We can try using prisma type directly if available, else standard interface
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Calendar, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { toast } from "sonner";

interface TaskBoardProps {
    tasks: any[]; // Using any to avoid type gymnastics with Relations for now, matching TaskListView input shape roughly
}

const COLUMNS = [
    { id: "TODO", title: "To Do", color: "bg-red-500/10 text-red-600" },
    { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500/10 text-blue-600" },
    { id: "DONE", title: "Done", color: "bg-green-500/10 text-green-600" },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
    const columns = useMemo(() => {
        const cols = {
            TODO: [] as any[],
            IN_PROGRESS: [] as any[],
            DONE: [] as any[],
        };

        tasks.forEach(task => {
            // Map legacy or other statuses if needed, but we rely on our schema enum
            const status = task.status as keyof typeof cols;
            if (cols[status]) {
                cols[status].push(task);
            } else {
                cols.TODO.push(task); // Fallback
            }
        });

        return cols;
    }, [tasks]);

    return (
        <div className="flex h-[calc(100vh-250px)] gap-6 overflow-x-auto pb-4">
            {COLUMNS.map(col => (
                <div key={col.id} className="flex-1 min-w-[300px] flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className={cn("px-3 py-1 rounded-full text-sm font-medium", col.color)}>
                            {col.title}
                            <span className="ml-2 opacity-60 text-xs">
                                {columns[col.id as keyof typeof columns].length}
                            </span>
                        </div>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 bg-muted/30 rounded-2xl p-3 border border-border/50">
                        <ScrollArea className="h-full pr-3">
                            <div className="flex flex-col gap-3">
                                {columns[col.id as keyof typeof columns].map(task => (
                                    <BoardCard key={task.id} task={task} />
                                ))}
                                {columns[col.id as keyof typeof columns].length === 0 && (
                                    <div className="h-24 flex items-center justify-center text-muted-foreground/40 text-sm italic border-2 border-dashed border-muted-foreground/10 rounded-xl">
                                        Empty
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            ))}
        </div>
    );
}

function BoardCard({ task }: { task: any }) {
    const handleMove = async (newStatus: string) => {
        try {
            await updateTask(task.id, { status: newStatus });
            toast.success("Task updated");
        } catch {
            toast.error("Failed to move task");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTask(task.id);
            toast.success("Task deleted");
        } catch {
            toast.error("Failed to delete task");
        }
    };

    return (
        <div className="p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className={cn(
                    "text-[10px] px-1.5 py-0 h-5",
                    task.priority === 1 ? "border-red-200 text-red-600 bg-red-50" :
                        task.priority === 2 ? "border-orange-200 text-orange-600 bg-orange-50" :
                            "border-muted text-muted-foreground"
                )}>
                    {task.priority === 1 ? "Critical" : task.priority === 2 ? "High" : "Normal"}
                </Badge>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMove("TODO")}>Move to Todo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMove("IN_PROGRESS")}>Move to In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMove("DONE")}>Move to Done</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <h4 className="font-medium text-sm text-foreground leading-snug mb-3">
                {task.title}
            </h4>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                {task.dueDate ? (
                    <div className={cn(
                        "flex items-center gap-1",
                        isPast(task.dueDate) && !isToday(task.dueDate) ? "text-red-500" : ""
                    )}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                    </div>
                ) : (
                    <span></span>
                )}

                {task.list && (
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {task.list.name}
                    </div>
                )}
            </div>
        </div>
    );
}
