"use client"

import { useState, useEffect } from "react"
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { reconcileStatements, confirmReconciliation, getReconciliationHistory, deleteReconciliationBatch, getBatchDetails, type ReconciliationReport } from "@/app/actions/reconcile"
import { ExpenseLinkDialog } from "./ExpenseLinkDialog"

export default function ReconciliationPageClient() {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [report, setReport] = useState<ReconciliationReport | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    // NEW State for Dialog
    const [linkingTx, setLinkingTx] = useState<{ merchant: string, amount: number, date: string } | null>(null)

    // NEW State for Nickname and History
    const [nickname, setNickname] = useState("")
    const [history, setHistory] = useState<any[]>([])

    // Fetch History on Load
    useEffect(() => {
        getReconciliationHistory().then(data => setHistory(data))
    }, [report]) // Refresh when report updates (after save)

    // Handle Drag & Drop
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
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (file: File) => {
        const isCSV = file.type === "text/csv" || file.name.endsWith(".csv")
        const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf")

        if (!isCSV && !isPDF) {
            setError("Please upload a .csv or .pdf file.")
            return
        }
        setFile(file)
        setError(null)
    }

    // Process Reconciliation
    const handleReconcile = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)
        setSuccessMsg(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            console.log("Starting reconciliation for file:", file.name, "Size:", file.size)
            const result = await reconcileStatements(formData)
            console.log("Reconciliation result:", result)

            if ('error' in result && result.error) {
                setError(result.error)
            } else if ('matched_transactions' in result) {
                setReport(result as ReconciliationReport)
            }
        } catch (err: any) {
            console.error("Reconciliation error:", err)
            const errorMsg = err?.message || err?.toString() || "An unexpected error occurred"
            setError(`Error: ${errorMsg}. Check if PDF is too large or try a CSV file.`)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle Confirm Logic
    const handleConfirm = async () => {
        if (!report) return
        setIsSaving(true)
        setError(null)
        setSuccessMsg(null)

        try {
            // Pass nickname (or filename fallback handled on server, but we pass what we have)
            const finalName = nickname.trim() || file?.name || "Untitled Batch"
            const fileName = file?.name || "Unknown File"

            const result = await confirmReconciliation(report.matched_transactions, fileName, finalName)

            if ('error' in result && result.error) {
                setError(result.error)
            } else if ('count' in result) {
                setSuccessMsg(`Successfully reconciled ${result.count} transactions!`)
                setReport(null) // Reset View
                setFile(null)
                setNickname("")
            }
        } catch (err) {
            setError("Failed to save to ledger.")
        } finally {
            setIsSaving(false)
        }
    }

    // Handle Link Success
    const handleLinkSuccess = (txId: string) => {
        // Remove the linked transaction from unauthorized list
        if (report && linkingTx) {
            const newUnauthorized = report.unauthorized_transactions.filter(
                t => t.merchant !== linkingTx.merchant || t.amount !== linkingTx.amount || t.date !== linkingTx.date
            )

            // Add to matched (optimistic update)
            const newMatched = [
                ...report.matched_transactions,
                { ...linkingTx, status: 'MATCHED', notes: 'Manually Linked', confidence: 1.0 }
            ]

            setReport({
                ...report,
                unauthorized_transactions: newUnauthorized,
                matched_transactions: newMatched as any
            })
            setSuccessMsg("Transaction manually linked!")
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Reconciliation Command Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered ledger verification and anomaly detection.
                    </p>
                </div>
                {report && (
                    <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => { setReport(null); setFile(null); setError(null); setSuccessMsg(null); }}>
                        Start New Session
                    </Button>
                )}
            </div>

            {/* Success Message Banner */}
            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-4 rounded-2xl relative shadow-[0_0_20px_-10px_rgba(34,197,94,0.5)] backdrop-blur-md">
                    <strong className="font-bold">System Verified: </strong>
                    <span className="block sm:inline">{successMsg}</span>
                </div>
            )}

            {/* Upload Area & History */}
            {!report && (
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Holographic Upload Zone */}
                    <div
                        className={cn(
                            "relative overflow-hidden rounded-3xl transition-all h-80 flex flex-col items-center justify-center text-center cursor-pointer col-span-2 md:col-span-1 border border-dashed border-border/50 bg-card/50 hover:bg-card",
                            isDragging ? "shadow-lg border-primary" : "hover:border-primary/50 hover:shadow-md"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        {/* Animated Gradient Border Effect */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br from-primary/10 via-orange-500/10 to-rose-500/10 opacity-0 transition-opacity duration-500",
                            (isDragging || file) ? "opacity-100" : "group-hover:opacity-50"
                        )}></div>

                        {/* Grid Pattern Overlay */}
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>

                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".csv,.pdf"
                            onChange={handleFileChange}
                        />

                        <div className="relative z-10 space-y-6 p-8">
                            <div className={cn("flex justify-center transition-all duration-500", isDragging ? "scale-110" : "")}>
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md shadow-xl",
                                    isDragging ? "animate-pulse border-primary/50 shadow-[0_0_30px_var(--primary)]" : ""
                                )}>
                                    {file ? <FileText className="h-10 w-10 text-primary" /> : <UploadCloud className="h-10 w-10 text-primary/80" />}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl tracking-tight">{file ? file.name : "Upload Statement"}</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto">
                                    {file ? "Ready to analyze" : "Drop CSV or PDF bank statement to initiate scan"}
                                </p>
                            </div>
                            {file && (
                                <Button size="lg" className="w-full shadow-lg shadow-primary/20" onClick={(e) => { e.stopPropagation(); handleReconcile(); }} disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isProcessing ? "Analyzing..." : "Initialize Scan"}
                                </Button>
                            )}
                            {error && <p className="text-red-400 text-sm font-medium animate-pulse bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">{error}</p>}
                        </div>
                    </div>

                    {/* History List */}
                    <Card className="col-span-2 md:col-span-1 bg-card border-border shadow-sm rounded-3xl h-80 flex flex-col">
                        <CardHeader>
                            <CardTitle>Saved Ledgers</CardTitle>
                            <CardDescription>Previous reconciliation sessions</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <p>No archives found.</p>
                                    </div>
                                ) : (
                                    history.map((batch) => (
                                        <div
                                            key={batch.id}
                                            className="group flex items-center justify-between p-4 border border-border rounded-2xl bg-card hover:bg-accent/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                                            onClick={async () => {
                                                setIsProcessing(true)
                                                try {
                                                    const details = await getBatchDetails(batch.id)
                                                    if (details) {
                                                        setReport(details as any)
                                                    }
                                                } catch (e) {
                                                    setError("Failed to load batch details")
                                                } finally {
                                                    setIsProcessing(false)
                                                }
                                            }}
                                        >
                                            <div>
                                                <p className="font-semibold text-sm">{batch.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{new Date(batch.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">
                                                    {batch._count.expenses} Verified
                                                </span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (!confirm("Are you sure? This will undo the reconciliation for these expenses.")) return

                                                        const res = await deleteReconciliationBatch(batch.id)
                                                        if (res.success) {
                                                            setHistory(prev => prev.filter(h => h.id !== batch.id))
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results View */}
            {report && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

                    {/* HUD Stats Row */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-green-400 font-medium text-sm uppercase tracking-widest mb-2">Verified (&gt;90%)</h3>
                            <div className="text-5xl font-bold text-green-400 tracking-tighter text-shadow-lg shadow-green-500/50">
                                {report.matched_transactions.length}
                            </div>
                        </div>

                        <div className={cn(
                            "border backdrop-blur-md rounded-3xl p-6 relative overflow-hidden group transition-colors",
                            (report.needs_review_transactions?.length || 0) > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-white/5 border-white/10"
                        )}>
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className={cn("font-medium text-sm uppercase tracking-widest mb-2", (report.needs_review_transactions?.length || 0) > 0 ? "text-orange-400" : "text-muted-foreground")}>
                                Needs Review
                            </h3>
                            <div className={cn("text-5xl font-bold tracking-tighter text-shadow-lg", (report.needs_review_transactions?.length || 0) > 0 ? "text-orange-400 shadow-orange-500/50" : "text-muted-foreground")}>
                                {report.needs_review_transactions?.length || 0}
                            </div>
                        </div>

                        <div className={cn(
                            "border backdrop-blur-md rounded-3xl p-6 relative overflow-hidden group transition-colors",
                            report.unauthorized_transactions.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
                        )}>
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className={cn("font-medium text-sm uppercase tracking-widest mb-2", report.unauthorized_transactions.length > 0 ? "text-red-400" : "text-muted-foreground")}>
                                Unauthorized
                            </h3>
                            <div className={cn("text-5xl font-bold tracking-tighter text-shadow-lg", report.unauthorized_transactions.length > 0 ? "text-red-400 shadow-red-500/50" : "text-muted-foreground")}>
                                {report.unauthorized_transactions.length}
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-yellow-400 font-medium text-sm uppercase tracking-widest mb-2">Missing from Bank</h3>
                            <div className="text-5xl font-bold text-yellow-400 tracking-tighter text-shadow-lg shadow-yellow-500/50">
                                {report.missing_from_bank.length}
                            </div>
                        </div>
                    </div>

                    {/* Unauthorized Alerts - Priority Stream */}
                    {report.unauthorized_transactions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center text-red-600 dark:text-red-400">
                                <AlertTriangle className="mr-2 h-5 w-5 animate-pulse" /> Security Alerts
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {report.unauthorized_transactions.map((tx, i) => (
                                    <div key={i} className="flex flex-col justify-between p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_var(--red-500)]"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-bold text-lg text-red-900 dark:text-red-200">{tx.merchant}</p>
                                                <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wider">{tx.date}</p>
                                            </div>
                                            <div className="font-mono text-xl font-bold text-red-700 dark:text-red-400">${tx.amount.toFixed(2)}</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-900 dark:text-red-200 border border-red-500/30"
                                            onClick={() => setLinkingTx(tx)}
                                        >
                                            Resolve / Link Manually
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Needs Review Section */}
                    {(report.needs_review_transactions?.length || 0) > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="mr-2 h-5 w-5" /> Needs Review (70-90% Confidence)
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {report.needs_review_transactions?.map((tx, i) => (
                                    <div key={i} className="flex flex-col justify-between p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_var(--orange-500)]"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-bold text-lg text-orange-900 dark:text-orange-200">{tx.merchant}</p>
                                                <p className="text-xs text-orange-700 dark:text-orange-400 uppercase tracking-wider">{tx.date}</p>
                                                <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">{tx.notes}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-xl font-bold text-orange-700 dark:text-orange-400">${tx.amount.toFixed(2)}</div>
                                                <div className="text-xs bg-orange-500/30 px-2 py-0.5 rounded-full mt-1">
                                                    {Math.round((tx.confidence || 0.75) * 100)}% match
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-900 dark:text-green-200 border border-green-500/30"
                                                onClick={() => {
                                                    // Approve the match - move to matched
                                                    setReport(prev => {
                                                        if (!prev) return prev;
                                                        const newReview = prev.needs_review_transactions?.filter((_, idx) => idx !== i) || [];
                                                        const newMatched = [...prev.matched_transactions, { ...tx, status: 'MATCHED' as const }];
                                                        return { ...prev, matched_transactions: newMatched, needs_review_transactions: newReview };
                                                    });
                                                }}
                                            >
                                                ✓ Approve Match
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 border-orange-500/30 text-orange-900 dark:text-orange-200"
                                                onClick={() => setLinkingTx(tx)}
                                            >
                                                Link Different
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Matched List - Verified Stream */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-1 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-black/20">
                            <h3 className="text-lg font-bold flex items-center text-green-400">
                                <CheckCircle className="mr-2 h-5 w-5" /> Verified Stream
                            </h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            <div className="divide-y divide-white/5">
                                {report.matched_transactions.map((tx, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_-2px_rgba(34,197,94,0.3)]">
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{tx.merchant}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-mono text-muted-foreground">{tx.date}</span>
                                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">{tx.notes}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-bold font-mono text-green-400/80">${tx.amount.toFixed(2)}</div>
                                    </div>
                                ))}
                                {report.matched_transactions.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No matched transactions in this batch.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Save Actions */}
                    <div className="flex items-center justify-end gap-4 p-6 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl sticky bottom-4 shadow-2xl">
                        <div className="flex-1 max-w-sm">
                            <Input
                                placeholder="Name this ledger (e.g. Nov '24 Statement)"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="bg-black/20 border-white/10 focus:border-primary/50"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" className="hover:text-red-400" onClick={() => { setReport(null); setSuccessMsg(null); }} disabled={isSaving}>Discard</Button>
                            <Button onClick={handleConfirm} disabled={isSaving || !!successMsg} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving to Ledger..." : successMsg ? "Saved Successfully" : "Confirm & Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {linkingTx && (
                <ExpenseLinkDialog
                    transaction={linkingTx}
                    isOpen={!!linkingTx}
                    onOpenChange={(open) => !open && setLinkingTx(null)}
                    onLinkSuccess={handleLinkSuccess}
                />
            )}
        </div>
    )
}
