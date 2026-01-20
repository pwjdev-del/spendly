"use client";

import { useState } from "react";
import { LayoutList, KanbanSquare, CheckSquare, Plus } from "lucide-react";
import { TaskInput } from "./TaskInput";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskListView } from "./TaskListView";
import { TaskBoard } from "./TaskBoard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { quickApprove, quickReject, quickReconcile } from "@/app/actions/todos";
import { toast } from "sonner";

interface TodoListProps {
    tasks: any[];
    systemTodos: any[];
    lists: any[];
}

type ViewMode = "LIST" | "BOARD";

export function TodoList({ tasks, systemTodos, lists }: TodoListProps) {
    const [view, setView] = useState<ViewMode>("LIST");

    // Merge system todos into tasks stream for display
    // We map system todos to look like tasks
    const mergedTasks = [
        ...systemTodos.map(t => ({
            id: t.id,
            title: t.title,
            description: t.reason,
            status: "TODO",
            priority: t.priority <= 2 ? 1 : t.priority <= 4 ? 2 : 3, // Map priority
            dueDate: new Date(), // Assume today for system tasks
            isSystem: true,
            systemType: t.type,
            original: t // Keep original for actions
        })),
        ...tasks
    ];

    // For TodoList/Board, we might want to inject custom rendering for system tasks later.
    // For now, they appear as tasks. To support "Process" buttons, we'd need to update TaskListView.
    // But let's ship the structure first.

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access</h1>
                    <p className="text-muted-foreground mt-1">
                        {mergedTasks.filter(t => t.status !== "DONE").length} pending tasks
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <CreateTaskDialog lists={lists}>
                        <Button className="gap-2 shadow-sm bg-primary/90 hover:bg-primary">
                            <Plus className="h-4 w-4" /> New Task
                        </Button>
                    </CreateTaskDialog>

                    <div className="bg-muted p-1 rounded-lg flex items-center gap-1">
                        <Button
                            variant={view === "LIST" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("LIST")}
                            className="h-8 w-8 p-0"
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === "BOARD" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setView("BOARD")}
                            className="h-8 w-8 p-0"
                        >
                            <KanbanSquare className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Task Input Area */}
            <div className="max-w-3xl mx-auto w-full">
                <TaskInput />
            </div>

            {/* Main Content */}
            <div className="flex-1 mt-4">
                {view === "LIST" ? (
                    <TaskListView tasks={mergedTasks} />
                ) : (
                    <TaskBoard tasks={mergedTasks} />
                )}
            </div>
        </div>
    );
}
