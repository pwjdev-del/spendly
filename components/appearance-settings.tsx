"use client"

import { useAppearance } from "@/components/appearance-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

export function AppearanceSettings() {
    const { fontFamily, setFontFamily, fontSize, setFontSize } = useAppearance()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-base">Font Family</Label>
                    <div className="text-sm text-muted-foreground">Select your preferred typography.</div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={fontFamily} onValueChange={(val: any) => setFontFamily(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sans">Modern (Sans)</SelectItem>
                            <SelectItem value="serif">Novel (Serif)</SelectItem>
                            <SelectItem value="mono">Code (Mono)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-base">Font Size</Label>
                    <div className="text-sm text-muted-foreground">Adjust the text size for readability.</div>
                </div>
                <Select value={fontSize} onValueChange={(val: any) => setFontSize(val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
