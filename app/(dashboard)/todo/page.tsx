import { getUnifiedTasks } from "@/app/actions/tasks";
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

    const { tasks, lists, systemTodos } = await getUnifiedTasks();

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl h-full flex flex-col">
            <TodoList tasks={tasks} systemTodos={systemTodos} lists={lists} />
        </div>
    );
}
