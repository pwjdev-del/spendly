"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface TripReportProps {
    trip: any // Using specific type would be better but keeping it loose for now to handle new relations easily
}

export function TripReportButton({ trip }: TripReportProps) {

    const generateReport = () => {
        const doc = new jsPDF()

        // Title
        doc.setFontSize(20)
        doc.text("Trip Report", 14, 22)

        // Trip Info
        doc.setFontSize(12)
        doc.text(`Trip Name: ${trip.name}`, 14, 32)
        doc.text(`Trip Number: ${trip.tripNumber}`, 14, 38)
        doc.text(`Status: ${trip.status}`, 14, 44)
        doc.text(`Dates: ${new Date(trip.startDate).toLocaleDateString()} - ${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'N/A'}`, 14, 50)

        // Workflow Roles
        doc.setFontSize(14)
        doc.text("Workflow Roles", 14, 65)

        doc.setFontSize(10)
        const creatorName = trip.user?.name || trip.user?.email || "Unknown"
        const approverName = trip.approver?.name || trip.approver?.email || "Pending"
        const auditorName = trip.auditor?.name || trip.auditor?.email || "Pending"

        const rolesData = [
            ["Role", "Name"],
            ["Creator (Submitter)", creatorName],
            ["Approver", approverName],
            ["Auditor", auditorName]
        ]

        autoTable(doc, {
            startY: 70,
            head: [['Role', 'User']],
            body: [
                ['Creator', creatorName],
                ['Approver', approverName],
                ['Auditor', auditorName]
            ],
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
        })

        // Budget Info
        let finalY = (doc as any).lastAutoTable.finalY + 10
        if (trip.budget) {
            doc.text(`Budget: $${trip.budget.toFixed(2)}`, 14, finalY)
            const totalSpent = trip.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
            doc.text(`Total Spent: $${totalSpent.toFixed(2)}`, 14, finalY + 6)
            finalY += 15
        }

        // Expenses Table
        doc.setFontSize(14)
        doc.text("Expenses", 14, finalY)

        const expenseRows = trip.expenses.map((expense: any) => [
            new Date(expense.date).toLocaleDateString(),
            expense.merchant,
            expense.category,
            expense.status,
            `$${expense.amount.toFixed(2)}`
        ])

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date', 'Merchant', 'Category', 'Status', 'Amount']],
            body: expenseRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        })

        // Save
        doc.save(`${trip.tripNumber}_Report.pdf`)
    }

    return (
        <Button variant="outline" onClick={generateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Download Report
        </Button>
    )
}
