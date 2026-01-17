"use client"

import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"

interface Expense {
    id: string
    date: Date
    merchant: string
    category: string
    status: string
    amount: number
    receiptUrl?: string | null
}

export function ExportPdfButton({ expenses }: { expenses: Expense[] }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            // Filter to only include APPROVED expenses
            const approvedExpenses = expenses.filter(e => e.status === 'APPROVED')

            if (approvedExpenses.length === 0) {
                alert("No approved expenses to export.")
                return
            }

            const doc = new jsPDF()

            doc.setFontSize(20)
            doc.text("Expense Report", 14, 22)
            doc.setFontSize(11)
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30)

            const tableData = approvedExpenses.map((e) => [
                new Date(e.date).toLocaleDateString(),
                e.merchant,
                e.category,
                e.status,
                `$${e.amount.toFixed(2)}`,
            ])

            autoTable(doc, {
                head: [["Date", "Merchant", "Category", "Status", "Amount"]],
                body: tableData,
                startY: 40,
            })

            const total = approvedExpenses.reduce((acc, curr) => acc + curr.amount, 0)

            // @ts-ignore
            const finalY = doc.lastAutoTable.finalY || 50
            doc.text(`Total Spend: $${total.toFixed(2)}`, 14, finalY + 10)

            // Add Receipts
            for (const expense of approvedExpenses) {
                if (expense.receiptUrl) {
                    try {
                        // Fetch the image
                        const response = await fetch(expense.receiptUrl)
                        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)

                        let blob = await response.blob()

                        // Handle HEIC/HEIF images by converting to JPEG
                        if (blob.type === 'image/heic' || blob.type === 'image/heif') {
                            try {
                                const heic2any = (await import('heic2any')).default
                                const convertedBlob = await heic2any({
                                    blob,
                                    toType: 'image/jpeg',
                                    quality: 0.8
                                })
                                blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
                            } catch (err) {
                                console.error("HEIC conversion failed:", err)
                                // Continue to see if it can be handled or fail gracefully later
                            }
                        }

                        doc.addPage()
                        doc.setFontSize(14)
                        doc.text(`Receipt: ${expense.merchant} - $${expense.amount.toFixed(2)}`, 14, 20)
                        doc.setFontSize(10)
                        doc.text(`Date: ${new Date(expense.date).toLocaleDateString()}`, 14, 28)

                        // Handle different file types
                        if (blob.type === 'application/pdf') {
                            doc.text("Receipt is a PDF document.", 14, 40)
                            doc.text("Please view the original file to see the receipt.", 14, 46)
                            if (expense.receiptUrl) {
                                doc.setTextColor(0, 0, 255)
                                doc.textWithLink("Click here to view receipt", 14, 54, { url: expense.receiptUrl })
                                doc.setTextColor(0, 0, 0)
                            }
                            continue
                        } else if (!blob.type.startsWith('image/')) {
                            doc.text(`Unsupported file type: ${blob.type}`, 14, 40)
                            continue
                        }

                        // Convert to base64
                        const base64Data = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                    resolve(reader.result)
                                } else {
                                    reject(new Error('Failed to convert image to base64'))
                                }
                            }
                            reader.onerror = () => reject(new Error('FileReader error'))
                            reader.readAsDataURL(blob)
                        })

                        // Sanity check for small files (likely error responses masquerading as images)
                        if (blob.size < 100) {
                            throw new Error(`Image too small (${blob.size} bytes), likely a server error response.`)
                        }

                        // Get dimensions using createImageBitmap (more robust than new Image())
                        let width = 600 // Default fallback width
                        let height = 800 // Default fallback height
                        let dimensionsFound = false

                        try {
                            const imgBitmap = await createImageBitmap(blob)
                            width = imgBitmap.width
                            height = imgBitmap.height
                            imgBitmap.close()
                            dimensionsFound = true
                        } catch (e) {
                            // Fallback to Image()
                            try {
                                const img = new Image()
                                img.src = base64Data
                                await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                        width = img.width
                                        height = img.height
                                        resolve(null)
                                    }
                                    img.onerror = () => reject(new Error('Image load failed'))
                                })
                                dimensionsFound = true
                            } catch (fallbackError) {
                                console.warn(`Failed to get dimensions for ${expense.merchant} receipt. Using defaults.`, fallbackError)
                                // We proceed with default width/height. 
                                // doc.addImage might still work if the binary data is okay but browser just refused to render it.
                            }
                        }

                        const pdfWidth = doc.internal.pageSize.getWidth() - 28
                        // Maintain aspect ratio if we found dimensions, otherwise use default vertical rect
                        const pdfHeight = (height * pdfWidth) / width

                        // Determine format
                        let imgType = 'JPEG'
                        if (blob.type === 'image/png') {
                            imgType = 'PNG'
                        } else if (blob.type === 'image/webp') {
                            // Convert WebP to JPEG via Canvas
                            const canvas = document.createElement('canvas')
                            canvas.width = width
                            canvas.height = height
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                                // We need to draw the image to convert it. 
                                // Since we closed the bitmap, we need a source.
                                // Actually, it's better to keep the bitmap open if we need to draw it.
                                const imgBitmapForCanvas = await createImageBitmap(blob)
                                ctx.drawImage(imgBitmapForCanvas, 0, 0)
                                const jpegData = canvas.toDataURL('image/jpeg', 0.8)
                                doc.addImage(jpegData, 'JPEG', 14, 35, pdfWidth, pdfHeight)
                                imgBitmapForCanvas.close()
                                continue
                            }
                        }

                        doc.addImage(base64Data, imgType, 14, 35, pdfWidth, pdfHeight)
                    } catch (error) {
                        // Log the full error to help debugging
                        console.error(`Error adding receipt for ${expense.merchant}:`, error instanceof Error ? error.message : error)
                    }
                }
            }

            doc.save("expenses_with_receipts.pdf")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
    )
}
