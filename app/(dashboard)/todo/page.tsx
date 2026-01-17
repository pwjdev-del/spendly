import { getTodos } from "@/app/actions/todos";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TodoList } from "@/components/todo/TodoList";

export const metadata = {
    title: "To-do | Kharcho",
    description: "Your actionable items",
};

export default async function TodoPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const todos = await getTodos();

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">To-do</h1>
                    <p className="text-muted-foreground mt-1">
                        {todos.length} actionable {todos.length === 1 ? "item" : "items"}
                    </p>
                </div>
            </div>

            <TodoList todos={todos} />
        </div>
    );
}
