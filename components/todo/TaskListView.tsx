"use client";

import { useState } from "react";
import { format, isToday, isPast, isTomorrow, isSameYear } from "date-fns";
import { Check, Circle, AlertCircle, Calendar, Flag, MoreHorizontal, Trash, CalendarClock, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleTaskComplete, deleteTask } from "@/app/actions/tasks";
import { quickApprove, quickReject } from "@/app/actions/todos";
import { toast } from "sonner";

interface Task {
    id: string;
    title: string;
    status: string;
    priority: number;
    dueDate: Date | null;
    list?: { name: string; color: string | null } | null;
    trip?: { id: string; name: string; tripNumber: string } | null;
    isSystem?: boolean;
    original?: any;
    systemType?: string;
}

interface TaskListViewProps {
    tasks: Task[];
}

export function TaskListView({ tasks }: TaskListViewProps) {
    // Group tasks
    const overdue = tasks.filter(t => t.status !== "DONE" && t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate));
    const today = tasks.filter(t => t.status !== "DONE" && (!t.dueDate || isToday(t.dueDate)));
    const upcoming = tasks.filter(t => t.status !== "DONE" && t.dueDate && !isPast(t.dueDate) && !isToday(t.dueDate));
    const done = tasks.filter(t => t.status === "DONE");

    const sections = [
        { title: "Overdue", items: overdue, color: "text-red-500" },
        { title: "My Day", items: today, color: "text-primary" },
        { title: "Upcoming", items: upcoming, color: "text-blue-500" },
        { title: "Completed", items: done, color: "text-muted-foreground" },
    ];

    return (
        <div className="space-y-8 pb-20">
            {sections.map((section) => section.items.length > 0 && (
                <div key={section.title} className="space-y-3">
                    <h3 className={cn("text-sm font-semibold flex items-center gap-2", section.color)}>
                        {section.title === "Overdue" && <AlertCircle className="h-4 w-4" />}
                        {section.title}
                        <span className="text-muted-foreground ml-2 text-xs font-normal bg-muted px-2 py-0.5 rounded-full">
                            {section.items.length}
                        </span>
                    </h3>

                    <div className="space-y-1">
                        {section.items.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            ))}

            {tasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p>No tasks found. Add one above!</p>
                </div>
            )}
        </div>
    );
}

function TaskItem({ task }: { task: Task }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            await toggleTaskComplete(task.id, task.status);
        } catch {
            toast.error("Failed to update task");
        } finally {
            setIsLoading(false);
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

    const priorityColor =
        task.priority === 1 ? "text-red-500" :
            task.priority === 2 ? "text-orange-500" :
                task.priority === 3 ? "text-blue-500" : "text-muted-foreground/30";

    return (
        <div className={cn(
            "group flex items-center gap-3 p-3 rounded-xl bg-card border border-transparent hover:border-border hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-200",
            task.status === "DONE" && "opacity-60 bg-muted/30"
        )}>
            {/* Checkbox */}
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                    task.status === "DONE"
                        ? "bg-primary border-primary text-primary-foreground"
                        : `border-muted-foreground/30 hover:border-primary ${priorityColor.replace("text-", "border-")}`
                )}
            >
                {task.status === "DONE" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={cn(
                    "font-medium truncate transition-all",
                    task.status === "DONE" && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {task.dueDate && (
                        <div className={cn(
                            "flex items-center gap-1",
                            task.status !== "DONE" && isPast(task.dueDate) && !isToday(task.dueDate) && "text-destructive font-medium",
                            task.status !== "DONE" && isToday(task.dueDate) && "text-green-600 font-medium",
                        )}>
                            <CalendarClock className="h-3 w-3" />
                            {isToday(task.dueDate) ? "Today" :
                                isTomorrow(task.dueDate) ? "Tomorrow" :
                                    format(task.dueDate, "d MMM")}
                        </div>
                    )}

                    {task.list && (
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-muted/50">
                            {task.list.color && (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.list.color }} />
                            )}
                            <span className="max-w-[100px] truncate">{task.list.name}</span>
                        </div>
                    )}

                    {task.trip && (
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                            <Plane className="w-3 h-3" />
                            <span className="max-w-[100px] truncate">{task.trip.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* System Task Actions */}
                {task.isSystem && task.original && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-green-200 hover:bg-green-50 text-green-700"
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await quickApprove(task.original.entityId);
                                    toast.success("Approved");
                                } catch {
                                    toast.error("Failed to approve");
                                }
                            }}
                        >
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-red-200 hover:bg-red-50 text-red-700"
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await quickReject(task.original.entityId);
                                    toast.error("Rejected");
                                } catch {
                                    toast.error("Failed to reject");
                                }
                            }}
                        >
                            Reject
                        </Button>
                    </>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
