"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Image as ImageIcon, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"
import { updateUserAvatar } from "@/app/actions/user-profile"

const ARTIST_AVATARS = [
    { id: 'purple', src: '/avatars/human-purple.png', name: 'Purple Wavy' },
    { id: 'orange', src: '/avatars/human-orange.png', name: 'Orange Hoodie' },
    { id: 'blue', src: '/avatars/human-blue.png', name: 'Blue Dreads' },
    { id: 'green', src: '/avatars/human-green.png', name: 'Beanie & Earrings' },
    { id: 'hijab', src: '/avatars/diverse-hijab.png', name: 'Teal Hijab' },
    { id: 'black-beard', src: '/avatars/diverse-black-beard.png', name: 'Beard & Glasses' },
    { id: 'asian-bob', src: '/avatars/diverse-asian-bob.png', name: 'Chic Bob' },
    { id: 'turban', src: '/avatars/diverse-turban.png', name: 'Orange Turban' },
    { id: 'latina-curly', src: '/avatars/diverse-latina-curly.png', name: 'Curly Volume' },
    { id: 'elderly', src: '/avatars/diverse-elderly.png', name: 'Silver Style' },
    { id: 'vitiligo', src: '/avatars/diverse-vitiligo.png', name: 'Mint & Pattern' },
    { id: 'braids', src: '/avatars/diverse-braids.png', name: 'Box Braids' },
    { id: 'asian-man', src: '/avatars/diverse-asian-man.png', name: 'Trendy Teal' },
]

interface AvatarSelectorProps {
    currentAvatar: string | null
    userName: string
    onAvatarChange?: (newAvatar: string) => void
}

import { useRouter } from "next/navigation"

export function AvatarSelector({ currentAvatar, userName, onAvatarChange }: AvatarSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTab, setSelectedTab] = useState("artist")
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            return
        }

        // Create local preview
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)

        // In a real app, we would upload to S3/Blob storage here.
        // For now, we'll simulate it or use a base64 string if small enough, but let's stick to the artist ones for the main demo.
        // Or we can just pretend it uploaded and use the local URL for the session (it won't persist across devices without real storage).
        // Let's implement a basic base64 converter for small files to persist them in the DB text field (not ideal for prod but works for MVP).

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64String = reader.result as string
            try {
                setIsUploading(true)
                await updateUserAvatar(base64String)
                onAvatarChange?.(base64String)
                router.refresh()
                setIsOpen(false)
                toast.success("Avatar updated!")
            } catch (error) {
                toast.error("Failed to update avatar")
            } finally {
                setIsUploading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const selectArtistAvatar = async (src: string) => {
        try {
            setIsUploading(true)
            await updateUserAvatar(src)
            onAvatarChange?.(src)
            router.refresh()
            setIsOpen(false)
            toast.success("Avatar updated!")
        } catch (error) {
            toast.error("Failed to update avatar")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                        <AvatarImage src={currentAvatar || ""} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {userName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Customize Avatar</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="artist" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="artist">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Artist Collection
                        </TabsTrigger>
                        <TabsTrigger value="upload">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="artist" className="mt-4">
                        <div className="grid grid-cols-4 gap-4">
                            {ARTIST_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    className="relative group aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                                    onClick={() => selectArtistAvatar(avatar.src)}
                                    disabled={isUploading}
                                >
                                    <img
                                        src={avatar.src}
                                        alt={avatar.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4">
                        <div className="flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed rounded-lg bg-muted/50">
                            {previewUrl ? (
                                <div className="relative w-32 h-32">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full rounded-full object-cover border-4 border-background shadow-md"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 w-8 h-8"
                                        onClick={() => setPreviewUrl(null)}
                                    >
                                        x
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-background rounded-full shadow-sm">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click to upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG (max 5MB)</p>
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="avatar-upload"
                                        onChange={handleFileChange}
                                    />
                                    <Label
                                        htmlFor="avatar-upload"
                                        className="cursor-pointer"
                                    >
                                        <Button variant="outline" size="sm" asChild>
                                            <span>Select Image</span>
                                        </Button>
                                    </Label>
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
