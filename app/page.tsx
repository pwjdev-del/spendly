import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LandingPageContent } from "@/components/landing/LandingPageContent"

export default async function LandingPage() {
    try {
        const session = await auth()

        if (session?.user) {
            redirect("/dashboard")
        }

        return <LandingPageContent />
    } catch (e: any) {
        console.error("Critical Auth Error:", e);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Critical Startup Error</h1>
                <div className="bg-gray-800 p-6 rounded-lg max-w-2xl overflow-auto w-full border border-gray-700">
                    <p className="font-mono text-sm text-yellow-300 mb-2">Error Message:</p>
                    <pre className="text-red-300 mb-4 whitespace-pre-wrap">{e?.message || "Unknown error"}</pre>

                    <p className="font-mono text-sm text-yellow-300 mb-2">Stack Trace:</p>
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap">{e?.stack || "No stack trace available"}</pre>
                </div>
            </div>
        )
    }
}
