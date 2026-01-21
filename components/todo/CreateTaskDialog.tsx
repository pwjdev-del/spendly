"use client";

import { useState, useTransition } from "react";
import { Plus, Calendar, Flag, List as ListIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTask } from "@/app/actions/tasks";
import { toast } from "sonner";

interface CreateTaskDialogProps {
    lists: any[];
    children?: React.ReactNode;
}

export function CreateTaskDialog({ lists = [], children }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("4");
    const [listId, setListId] = useState("inbox");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        startTransition(async () => {
            const formData = new FormData();

            // We append the raw title, but we might want to construct a "smart" string 
            // OR we update the server action to take explicit fields.
            // For now, let's construct a smart string to reuse the existing NLP or just pass raw title
            // if we assume the server parses it.
            // Wait, the server uses `chrono-node` on the title. 
            // If we have explicit date/priority, we should probably append them as flags 
            // OR update the server action to accept explicit overrides.

            // Let's modify the title to include flags if the user selected them explicitly,
            // to ensure they are picked up by the NLP if we don't change the server action yet.
            // Actually, cleaner to update server action, but "smart string" is robust enough for now.
            // "Buy milk !!p1"

            let finalTitle = title;
            if (priority !== "4") finalTitle += ` !!p${priority}`;

            // Date is harder to pass as string reliably without NLP getting confused, 
            // but the server action *only* looks at the text. 
            // Ideally we need to update createTask to accept `dueDate` explicitly.

            formData.append("title", finalTitle);
            formData.append("description", description);
            if (listId !== "inbox") formData.append("listId", listId);

            // WORKAROUND: We need to pass the date explicitly.
            // Let's add a hidden field "explicitDate" to the formData and handle it in server action if we can
            // But we can't easily change the server action signature without `tasks.ts` edit.
            // Let's Edit `tasks.ts` next to handle explicit date.
            if (date) formData.append("explicitDate", date.toISOString());

            try {
                await createTask(formData);
                setOpen(false);
                setTitle("");
                setDescription("");
                setPriority("4");
                setListId("inbox");
                setDate(undefined);
                toast.success("Task created");
            } catch (error) {
                toast.error("Failed to create task");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                            Add a new actionable item to your list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Input
                                id="title"
                                placeholder="Task name"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                className="text-lg py-6"
                            />
                            <Textarea
                                placeholder="Add a description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="resize-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1" className="text-red-600 font-medium">Critical (P1)</SelectItem>
                                    <SelectItem value="2" className="text-orange-600 font-medium">High (P2)</SelectItem>
                                    <SelectItem value="3" className="text-blue-600 font-medium">Normal (P3)</SelectItem>
                                    <SelectItem value="4">None (P4)</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={listId} onValueChange={setListId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="List" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inbox">Inbox</SelectItem>
                                    {lists.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a due date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending || !title.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
