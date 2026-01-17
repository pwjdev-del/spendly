"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { SafeMath } from "@/lib/math"

interface Expense {
    id: string
    date: Date
    merchant: string
    category: string
    status: string
    amount: number
    currency: string
    receiptUrl?: string | null
    user?: {
        name: string | null
        email: string | null
    }
    trip?: {
        name: string
    } | null
}

export function ExportCsvButton({ expenses }: { expenses: Expense[] }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            if (expenses.length === 0) {
                alert("No expenses to export.")
                return
            }

            // CSV Header
            const headers = ["Date", "Merchant", "Category", "Status", "Amount", "Currency", "Submitted By", "Trip", "Receipt URL"]

            // CSV Rows
            const rows = expenses.map(e => [
                new Date(e.date).toISOString().split('T')[0], // YYYY-MM-DD format
                `"${e.merchant.replace(/"/g, '""')}"`, // Escape quotes
                e.category,
                e.status,
                SafeMath.toDollars(e.amount).toFixed(2),
                e.currency || "USD",
                `"${(e.user?.name || e.user?.email || 'Unknown').replace(/"/g, '""')}"`,
                e.trip?.name ? `"${e.trip.name.replace(/"/g, '""')}"` : "",
                e.receiptUrl || ""
            ])

            // Combine headers and rows
            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n")

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error("CSV Export Error:", error)
            alert("Failed to export CSV. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
    )
}
