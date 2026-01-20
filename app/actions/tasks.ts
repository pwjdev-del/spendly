"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as chrono from 'chrono-node';
import { getTodos } from "./todos";

// Types
export type TaskPriority = 1 | 2 | 3 | 4; // 1 = Critical, 4 = None
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export async function parseTaskInput(input: string) {
    const results = chrono.parse(input);
    const date = results.length > 0 ? results[0].start.date() : null;

    // Simple priority parsing (!!p1, !!p2, etc)
    let priority: TaskPriority = 4;
    if (input.includes("!!p1")) priority = 1;
    else if (input.includes("!!p2")) priority = 2;
    else if (input.includes("!!p3")) priority = 3;

    // Remove parsed metadata from title
    let title = input
        .replace(/!!p[1-4]/g, "")
        .trim();

    if (results.length > 0) {
        // Remove the date text from the title
        title = title.replace(results[0].text, "").replace(/\s+/, " ").trim();
    }

    return { title, date, priority };
}

export async function createTask(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const rawInput = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const listId = formData.get("listId") as string | null;
    const explicitDate = formData.get("explicitDate") as string | null;

    let { title, date, priority } = await parseTaskInput(rawInput);

    if (explicitDate) {
        date = new Date(explicitDate);
    }

    // If no list provided, put in "Inbox" (handled by null listId or default list logic)
    // For now we use null listId as Inbox

    await prisma.task.create({
        data: {
            title,
            description,
            priority,
            dueDate: date,
            ownerId: userId,
            listId: listId || undefined,
            status: "TODO"
        }
    });

    revalidatePath("/todo");
    return { success: true };
}

export async function updateTask(taskId: string, data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.task.update({
        where: { id: taskId, ownerId: session.user.id },
        data
    });

    revalidatePath("/todo");
    return { success: true };
}

export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.task.delete({
        where: { id: taskId, ownerId: session.user.id }
    });

    revalidatePath("/todo");
    return { success: true };
}

export async function toggleTaskComplete(taskId: string, currentStatus: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    await prisma.task.update({
        where: { id: taskId, ownerId: session.user.id },
        data: { status: newStatus }
    });

    revalidatePath("/todo");
    return { success: true };
}

export async function getUnifiedTasks() {
    const session = await auth();
    if (!session?.user?.id) return { tasks: [], lists: [], systemTodos: [] };

    const userId = session.user.id;

    // 1. Fetch User Lists
    const lists = await prisma.taskList.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "asc" }
    });

    // 2. Fetch User Tasks (Excluding done tasks older than 7 days)
    const tasks = await prisma.task.findMany({
        where: {
            ownerId: userId,
            OR: [
                { status: { not: "DONE" } },
                { status: "DONE", updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            ]
        },
        orderBy: [
            { priority: "asc" },
            { dueDate: "asc" },
            { createdAt: "desc" }
        ],
        include: {
            list: true
        }
    });

    // 3. Fetch System Todos (Approvals, etc)
    const systemTodos = await getTodos();

    return { tasks, lists, systemTodos };
}

export async function createList(name: string, color?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.taskList.create({
        data: {
            name,
            color,
            ownerId: session.user.id
        }
    });

    revalidatePath("/todo");
}
