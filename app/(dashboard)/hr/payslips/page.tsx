"use client"

import { useEffect, useState } from "react"
import { getPayslips } from "@/app/actions/hr"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"

export default function PayslipsPage() {
    const [payslips, setPayslips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPayslips().then(data => {
            setPayslips(data)
            setLoading(false)
        })
    }, [])

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Payslips</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Loading payslips...</p>
                ) : payslips.length === 0 ? (
                    <p className="text-muted-foreground col-span-full">No published payslips available.</p>
                ) : (
                    payslips.map(ps => (
                        <Card key={ps.id} className="bg-card hover:bg-accent/5 transition-colors group cursor-pointer border border-[#1E3A5F]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">
                                    {new Date(ps.year, ps.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </CardTitle>
                                <div className="p-2 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Gross Pay:</span>
                                        <span className="font-medium">${ps.grossPay.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Deductions:</span>
                                        <span className="font-medium text-destructive">-${ps.deductions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 mt-2 border-t border-border">
                                        <span>Net Pay:</span>
                                        <span className="text-success">${ps.netPay.toLocaleString()}</span>
                                    </div>
                                </div>
                                {ps.documentUrl && (
                                    <div className="mt-4 text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="w-3 h-3" /> Download PDF
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
