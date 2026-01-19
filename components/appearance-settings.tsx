"use client"

import { useAppearance } from "@/components/appearance-provider"
import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppearanceSettings() {
    const { fontFamily, setFontFamily, fontSize, setFontSize } = useAppearance()
    const { theme, setTheme } = useTheme()

    const themes = [
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'system', label: 'System', icon: Monitor },
    ]

    const fontOptions = [
        { id: 'sans', label: 'Modern', description: 'Clean & Clear' },
        { id: 'serif', label: 'Novel', description: 'Classic & Elegant' },
        { id: 'mono', label: 'Code', description: 'Precise & Technical' },
    ]

    return (
        <div className="space-y-8">
            {/* Theme Selection */}
            <div className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Choose Your Vibe</Label>
                    <p className="text-sm text-muted-foreground mt-1">Select your preferred color theme</p>
                </div>
                <div className="flex gap-3">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                theme === t.id
                                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(45,212,191,0.4)]"
                                    : "border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <t.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Dashboard Preview */}
            <div className="space-y-4">
                <Label className="text-base font-medium">Preview</Label>
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className={cn(
                        "rounded-lg p-4 transition-colors",
                        theme === 'dark' ? "bg-[#0A1628]" : theme === 'light' ? "bg-[#F5F7FA]" : "bg-muted"
                    )}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <div className="w-4 h-4 rounded bg-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="h-2 w-20 bg-foreground/20 rounded" />
                                <div className="h-1.5 w-12 bg-muted-foreground/30 rounded mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="h-12 rounded-lg bg-muted/50" />
                            <div className="h-12 rounded-lg bg-primary/20" />
                            <div className="h-12 rounded-lg bg-muted/50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Text Style */}
            <div className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Text Style</Label>
                    <p className="text-sm text-muted-foreground mt-1">Choose your preferred typography</p>
                </div>
                <div className="grid gap-3">
                    {fontOptions.map((font) => (
                        <button
                            key={font.id}
                            onClick={() => setFontFamily(font.id as 'sans' | 'serif' | 'mono')}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                fontFamily === font.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/50"
                            )}
                        >
                            <div>
                                <span className={cn(
                                    "font-medium",
                                    font.id === 'sans' && "font-sans",
                                    font.id === 'serif' && "font-serif",
                                    font.id === 'mono' && "font-mono"
                                )}>{font.label}</span>
                                <p className="text-sm text-muted-foreground">{font.description}</p>
                            </div>
                            <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                fontFamily === font.id ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                                {fontFamily === font.id && (
                                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-medium">Font Size</Label>
                        <p className="text-sm text-muted-foreground mt-1">Adjust for readability</p>
                    </div>
                    <span className="text-sm font-medium text-primary capitalize">{fontSize}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">A</span>
                    <div className="flex-1 flex gap-2">
                        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                            <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={cn(
                                    "flex-1 h-2 rounded-full transition-colors",
                                    fontSize === size ||
                                        (['sm', 'md', 'lg', 'xl'].indexOf(size) <= ['sm', 'md', 'lg', 'xl'].indexOf(fontSize))
                                        ? "bg-primary"
                                        : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                    <span className="text-lg text-muted-foreground">A</span>
                </div>
            </div>

            {/* Accessibility */}
            <div className="space-y-4">
                <Label className="text-base font-medium">Accessibility</Label>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">High Contrast</Label>
                            <p className="text-xs text-muted-foreground">Increase color contrast for better visibility</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Reduce Motion</Label>
                            <p className="text-xs text-muted-foreground">Minimize animations</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </div>
        </div>
    )
}
