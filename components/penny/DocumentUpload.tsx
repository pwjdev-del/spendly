"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { processReceipt } from "@/lib/ocr"
import { processDocumentWithAI, createExpenseFromDocument, uploadReceiptFile } from "@/app/actions/document-processing"
import { toast } from "sonner"

interface DocumentUploadProps {
    onUploadComplete?: (result: any) => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

    const handleFile = useCallback(async (file: File) => {
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!validTypes.includes(file.type)) {
            toast.error("Please upload a JPG, PNG, or PDF file")
            return
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error("File size must be less than 10MB")
            return
        }

        setIsProcessing(true)
        setUploadStatus('processing')

        try {
            // 1. Upload file to storage (server-side)
            const formData = new FormData()
            formData.append('file', file)

            const uploadResult = await uploadReceiptFile(formData)
            if (uploadResult.error) {
                toast.error(uploadResult.error)
                setUploadStatus('error')
                setIsProcessing(false)
                return
            }
            const fileUrl = uploadResult.fileUrl!

            // 2. Process with OCR (client-side for images)
            let ocrText = ""
            if (file.type.startsWith('image/')) {
                const receiptData = await processReceipt(fileUrl)
                ocrText = receiptData.rawText
            } else {
                ocrText = "PDF processing not yet implemented"
            }

            // 3. Use AI to extract structured data
            const processedData = await processDocumentWithAI(fileUrl, ocrText)

            // 4. If we have good data, create the expense
            if (processedData.merchant && processedData.amount && processedData.confidence > 60) {
                const result = await createExpenseFromDocument({
                    merchant: processedData.merchant,
                    amount: processedData.amount,
                    category: processedData.category,
                    date: processedData.date,
                    documentUrl: fileUrl
                })

                if (result.success) {
                    setUploadStatus('success')
                    toast.success(`Created expense: $${processedData.amount} at ${processedData.merchant}`)
                    onUploadComplete?.(result.expense)
                } else {
                    setUploadStatus('error')
                    toast.error(result.error || "Failed to create expense")
                }
            } else {
                setUploadStatus('error')
                toast.error("Could not extract expense data from document. Please try a clearer image.")
            }
        } catch (error) {
            console.error("Upload error:", error)
            setUploadStatus('error')
            toast.error("Failed to process document")
        } finally {
            setIsProcessing(false)
            // Reset status after 3 seconds
            setTimeout(() => setUploadStatus('idle'), 3000)
        }
    }, [onUploadComplete])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }, [handleFile])

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
                "relative border-2 border-dashed rounded-2xl p-6 transition-all",
                isDragging && "border-violet-500 bg-violet-500/5",
                !isDragging && "border-muted-foreground/20 hover:border-muted-foreground/40",
                isProcessing && "opacity-50 pointer-events-none"
            )}
        >
            <input
                type="file"
                id="document-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleInputChange}
                disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-3 pointer-events-none">
                {uploadStatus === 'processing' && (
                    <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                )}
                {uploadStatus === 'success' && (
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                )}
                {uploadStatus === 'error' && (
                    <XCircle className="h-10 w-10 text-red-500" />
                )}
                {uploadStatus === 'idle' && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-white" />
                    </div>
                )}

                <div className="text-center">
                    <p className="font-medium text-sm">
                        {uploadStatus === 'processing' && "Processing receipt..."}
                        {uploadStatus === 'success' && "Expense created!"}
                        {uploadStatus === 'error' && "Upload failed"}
                        {uploadStatus === 'idle' && "Upload receipt or invoice"}
                    </p>
                    {uploadStatus === 'idle' && (
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, PDF · Max 10MB
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
