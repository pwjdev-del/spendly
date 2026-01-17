import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ProfileForm } from "./form"
import { redirect } from "next/navigation"
import { decrypt } from "@/lib/encryption"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            phoneNumber: true,
            avatarUrl: true
        }
    })

    if (!user) {
        return <div>User not found.</div>
    }

    // Adapt prisma user to component interface (map avatarUrl to image)
    // Decrypt phone number for display if it's encrypted
    let plainPhone = user.phoneNumber
    if (plainPhone && plainPhone.includes(':')) {
        try {
            plainPhone = decrypt(plainPhone)
        } catch (e) {
            console.error("Failed to decrypt phone number", e)
            // Keep original if decrypt fails (avoids crashing UI, though it will show garbage)
        }
    }

    const userData = {
        ...user,
        phoneNumber: plainPhone,
        image: user.avatarUrl || null
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>
            <div className="border-b" />
            <ProfileForm user={userData} />
        </div>
    )
}
