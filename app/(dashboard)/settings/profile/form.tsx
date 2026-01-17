"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/app/actions/user-profile"
import { Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
    id: string
    name: string | null
    email: string | null
    image: string | null // Mapped from avatarUrl
    bio: string | null
    phoneNumber: string | null
}

export function ProfileForm({ user }: { user: UserProfile }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [avatarUrl, setAvatarUrl] = useState(user.image)
    const [isUploading, setIsUploading] = useState(false)
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (data.success) {
                setAvatarUrl(data.url)
            } else {
                console.error("Upload failed", data.error)
            }
        } catch (error) {
            console.error("Upload error", error)
        } finally {
            setIsUploading(false)
        }
    }

    async function handleSubmit(formData: FormData) {
        setFormMessage(null)
        startTransition(async () => {
            // Append the avatarUrl if it was changed
            if (avatarUrl) {
                formData.set("avatarUrl", avatarUrl)
            }

            const result = await updateProfile(null, formData)

            if (result.message === "success") {
                if (result.emailChanged) {
                    setFormMessage({ type: 'success', text: "Profile updated! Please log in again with your new email." })
                    // Optional: redirect to login after a delay
                    setTimeout(() => router.push("/login"), 2000)
                } else {
                    setFormMessage({ type: 'success', text: "Profile updated successfully." })
                    router.refresh()
                }
            } else {
                setFormMessage({ type: 'error', text: result.message || "Failed to update profile." })
            }
        })
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 border-2 border-muted">
                        <AvatarImage src={avatarUrl || ""} className="object-cover" />
                        <AvatarFallback className="text-4xl">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading || isPending}
                        />
                        <Label
                            htmlFor="avatar-upload"
                            className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Change Avatar
                        </Label>
                    </div>
                </div>

                {/* Fields Section */}
                <div className="flex-1 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={user.name || ""}
                            placeholder="Your name"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            defaultValue={user.email || ""}
                            placeholder="user@example.com"
                        />
                        <p className="text-xs text-muted-foreground">Changing your email may require you to log in again.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            defaultValue={user.bio || ""}
                            placeholder="Tell us a little about yourself"
                            className="resize-none"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            defaultValue={user.phoneNumber || ""}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="border-t pt-4 mt-6">
                        <h4 className="text-sm font-medium mb-4">Change Password (Optional)</h4>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {formMessage && (
                <div className={`p-3 rounded-md text-sm ${formMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {formMessage.text}
                </div>
            )}

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isPending || isUploading}>
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
