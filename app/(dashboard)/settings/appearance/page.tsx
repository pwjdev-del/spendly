import { AppearanceSettings } from "@/components/appearance-settings"
import { ModeToggle } from "@/components/mode-toggle"

export default function AppearancePage() {
    return (
        <div className="rounded-[24px] border border-border bg-card shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_10px_var(--pink-500)] animate-pulse" />
                        Appearance
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Customize the interface experience</p>
                </div>
                <ModeToggle />
            </div>
            <AppearanceSettings />
        </div>
    )
}
