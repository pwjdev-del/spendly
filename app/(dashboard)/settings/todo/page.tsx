import { CheckSquare } from "lucide-react"

export default function TodoSettingsPage() {
    return (
        <div className="rounded-[24px] border border-dashed border-border p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Settings Available</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                The To-do module works out of the box. Future configuration options will appear here.
            </p>
        </div>
    )
}
