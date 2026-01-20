"use client"

import { useState } from "react"
import { Building2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateOrganizationName } from "@/app/actions/organization"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface OrganizationSettingsProps {
    initialName: string
}

export function OrganizationSettings({ initialName }: OrganizationSettingsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(initialName)
    const router = useRouter()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateOrganizationName(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Space name updated")
            router.refresh()
        }

        setIsLoading(false)
    }

    return (
        <div className="rounded-[24px] border border-border bg-card shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:bg-blue-500/10 transition-colors duration-500"></div>

            <div className="p-8 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Space Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Customize your organization identity</p>
            </div>

            <form onSubmit={onSubmit} className="p-8 space-y-8">
                <div className="grid gap-2 max-w-xl">
                    <Label htmlFor="orgName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Space Name</Label>
                    <div className="flex gap-4">
                        <Input
                            id="orgName"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background border-input focus:border-blue-500/50 h-12 flex-1"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">This name will be displayed in the sidebar for all members.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                        type="submit"
                        disabled={isLoading || name === initialName}
                        className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white font-bold h-11 px-8 rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
