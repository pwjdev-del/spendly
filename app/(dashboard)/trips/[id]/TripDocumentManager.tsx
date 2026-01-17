"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Upload, Eye, File, Loader2 } from "lucide-react"
import { uploadTripDocument } from "@/app/actions/trips"
import { toast } from "sonner"

export function TripDocumentManager({ tripId, documents }: { tripId: string, documents: any[] }) {
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState("")

    async function handleUpload(formData: FormData) {
        setIsUploading(true)
        // Append custom name if provided
        if (fileName) {
            formData.set("name", fileName)
        }

        const result = await uploadTripDocument(tripId, formData)

        if (result?.success) {
            toast.success("Document uploaded")
            // Reset form (simple way: reload or controlled input reset)
            const form = document.getElementById("upload-form") as HTMLFormElement
            form?.reset()
            setFileName("")
        } else {
            toast.error(result?.error || "Upload failed")
        }
        setIsUploading(false)
    }

    return (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-zinc-800 dark:text-zinc-100">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Documents
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Upload Form */}
                <form id="upload-form" action={handleUpload} className="space-y-4 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="doc-name" className="text-zinc-600 dark:text-zinc-400">Document Name (Optional)</Label>
                        <Input
                            id="doc-name"
                            placeholder="e.g., Flight Ticket, Hotel Booking"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="doc-file" className="text-zinc-600 dark:text-zinc-400">File</Label>
                        <Input id="doc-file" name="file" type="file" required className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 cursor-pointer file:text-indigo-600" />
                    </div>
                    <Button type="submit" disabled={isUploading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium w-full md:w-auto">
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload Document
                    </Button>
                </form>

                {/* Documents List */}
                <div className="space-y-3">
                    {documents.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <p className="text-sm text-zinc-500 font-medium">No documents uploaded yet</p>
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc.id} className="group flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500/30 hover:shadow-sm transition-all bg-white dark:bg-zinc-900">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg">
                                        <File className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{doc.name}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                                            {new Date(doc.createdAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                    </a>
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
