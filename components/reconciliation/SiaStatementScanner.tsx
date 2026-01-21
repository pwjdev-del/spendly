"use client"

import { useState } from "react"
import { UploadCloud, FileText, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiaStatementScanner() {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isScanning, setIsScanning] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleScan = async () => {
        if (!file) return
        setIsScanning(true)
        // Simulate AI Scan for now (Backend unimplemented)
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsScanning(false)
        alert("Sia found 3 subscriptions! (Demo)")
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="text-purple-400 h-5 w-5" />
                <h3 className="font-semibold text-lg">Sia Statement Scanner</h3>
            </div>

            <div
                className={cn(
                    "relative overflow-hidden rounded-3xl transition-all h-64 flex flex-col items-center justify-center text-center cursor-pointer border border-dashed border-border bg-card/40 hover:bg-card/60",
                    isDragging ? "shadow-lg border-purple-500/50 bg-purple-500/5" : "hover:border-purple-500/30"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('sia-upload')?.click()}
            >
                <input
                    id="sia-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.pdf"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />

                <div className="relative z-10 space-y-4 p-6">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md shadow-xl mx-auto transition-transform",
                        isDragging ? "scale-110" : ""
                    )}>
                        {file ? <FileText className="h-8 w-8 text-purple-400" /> : <UploadCloud className="h-8 w-8 text-purple-400/80" />}
                    </div>

                    <div>
                        <h3 className="font-medium text-lg text-foreground">{file ? file.name : "Drop Bank Statement"}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[200px] mx-auto">
                            {file ? "Ready to extract subscriptions" : "Upload PDF or CSV to auto-detect recurring payments"}
                        </p>
                    </div>

                    {file && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                            onClick={(e) => { e.stopPropagation(); handleScan(); }}
                            disabled={isScanning}
                        >
                            {isScanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isScanning ? "Sia is Analyzing..." : "Start Scan"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
