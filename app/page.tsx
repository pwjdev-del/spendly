import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LandingPageContent } from "@/components/landing/LandingPageContent"

export default async function LandingPage() {
    const session = await auth()

    if (session?.user) {
        redirect("/dashboard")
    }

    return <LandingPageContent />
}
