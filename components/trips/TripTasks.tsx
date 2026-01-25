"use client"

import { useState, useRef } from "react"
import { CheckCircle2, Circle, Plus, Trash2, ClipboardPaste } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTripTask, updateTaskStatus, deleteTask, bulkCreateTripTasks } from "@/app/actions/trip-tasks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Task {
    id: string
    title: string
    status: string
}

interface TripTasksProps {
    tripId: string
    tasks: Task[]
}

export function TripTasks({ tripId, tasks }: TripTasksProps) {
    const [newTask, setNewTask] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [bulkText, setBulkText] = useState("")
    const [isBulkOpen, setIsBulkOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleAddTask(e?: React.FormEvent) {
        if (e) e.preventDefault()
        if (!newTask.trim()) return

        setIsAdding(true)
        const result = await createTripTask(tripId, newTask)
        setIsAdding(false)

        if (result.success) {
            setNewTask("")
            toast.success("Task added")
        } else {
            toast.error(result.error)
        }
    }

    async function handleToggleStatus(task: Task) {
        const newStatus = task.status === "DONE" ? "TODO" : "DONE"
        // Optimistic update could go here, but rely on Server Action revalidate for simplicity
        const result = await updateTaskStatus(task.id, newStatus)
        if (!result.success) {
            toast.error("Failed to update task")
        }
    }

    async function handleDelete(taskId: string) {
        const result = await deleteTask(taskId)
        if (result.success) {
            toast.success("Task deleted")
        } else {
            toast.error("Failed to delete task")
        }
    }

    async function handleBulkAdd() {
        if (!bulkText.trim()) return

        // Split by newlines and filter empty
        const titles = bulkText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0)

        if (titles.length === 0) return

        setIsLoading(true)
        const result = await bulkCreateTripTasks(tripId, titles)
        setIsLoading(false)

        if (result.success) {
            toast.success(`${titles.length} tasks added`)
            setBulkText("")
            setIsBulkOpen(false)
        } else {
            toast.error(result.error)
        }
    }

    const completedTasks = tasks.filter(t => t.status === "DONE")
    const pendingTasks = tasks.filter(t => t.status !== "DONE")

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    Tasks
                    <span className="text-muted-foreground text-sm font-normal ml-2">
                        {completedTasks.length}/{tasks.length}
                    </span>
                </h3>

                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <ClipboardPaste className="w-3.5 h-3.5 mr-2" />
                            Bulk Add
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Add Tasks</DialogTitle>
                            <DialogDescription>
                                Paste a list of tasks (one per line).
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="Buy adapter&#10;Book taxi&#10;Print tickets"
                            className="min-h-[200px]"
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                            <Button onClick={handleBulkAdd} disabled={isLoading}>
                                {isLoading ? "Adding..." : "Add Tasks"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <form onSubmit={handleAddTask} className="flex gap-2">
                <Input
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isAdding || !newTask.trim()}>
                    <Plus className="w-4 h-4" />
                </Button>
            </form>

            <div className="space-y-2">
                {pendingTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                        <button onClick={() => handleToggleStatus(task)} className="text-zinc-400 hover:text-indigo-500 transition-colors">
                            <Circle className="w-5 h-5" />
                        </button>
                        <span className="flex-1 text-sm font-medium">{task.title}</span>
                        <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {completedTasks.length > 0 && (
                    <div className="pt-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed</div>
                        {completedTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent opacity-60 hover:opacity-100 transition-opacity group">
                                <button onClick={() => handleToggleStatus(task)} className="text-indigo-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <span className="flex-1 text-sm line-through text-muted-foreground">{task.title}</span>
                                <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks yet. Add one above!
                    </div>
                )}
            </div>
        </div>
    )
}
