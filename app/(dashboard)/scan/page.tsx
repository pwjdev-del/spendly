"use client"

import { useState, useRef, useEffect } from "react"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { Button } from "@/components/ui/button"
import { Camera, ChevronLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ScanPage() {
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const triggerCamera = () => {
        fileInputRef.current?.click()
    }

    // Auto-trigger camera on mount if needed, or just let user click
    // For now, specifically explicit click to avoid jarring permissions

    if (file) {
        return (
            <div className="h-full w-full bg-[#0A1628]">
                {/* ExpenseForm handles its own layout, but we need to ensure it's contained if needed */}
                <ExpenseForm
                    trips={[]} // We might need to fetch trips or handle it within ExpenseForm if it fetches
                    initialFile={file}
                    onCancel={() => setFile(null)}
                    onSuccess={() => router.push('/expenses')}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#0A1628] p-6 text-white">
            <div className="flex items-center mb-8">
                <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold ml-2">Scan Receipt</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="w-64 h-64 rounded-full bg-[#0F1D2E] border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group hover:border-[#2DD4BF] transition-colors cursor-pointer" onClick={triggerCamera}>
                    <div className="absolute inset-0 bg-[#2DD4BF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Camera className="w-20 h-20 text-slate-500 group-hover:text-[#2DD4BF] transition-colors" />
                    <span className="absolute bottom-12 text-sm font-medium text-slate-500 group-hover:text-[#2DD4BF]">Tap to Scan</span>
                </div>

                <div className="text-center space-y-2 max-w-xs mx-auto">
                    <h2 className="text-2xl font-bold">Snap a Receipt</h2>
                    <p className="text-slate-400">Position your receipt within the frame to automatically extract details.</p>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            <div className="mt-auto pt-8">
                <Button
                    onClick={triggerCamera}
                    className="w-full h-14 bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#0A1628] rounded-2xl text-lg font-bold shadow-lg shadow-[#2DD4BF]/20"
                >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                </Button>
            </div>
        </div>
    )
}
