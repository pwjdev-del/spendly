"use client"

import { createExpense } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useSearchParams } from "next/navigation"
import { Camera, Check, ChevronsUpDown, Loader2, MapPin, ArrowLeft, MoreHorizontal, Store, Edit3, ScanLine, RotateCcw, ChevronDown } from "lucide-react"
import { useOffline } from "@/components/providers/OfflineSyncProvider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SafeMath } from "@/lib/math"
// Dynamic import for LocationPicker
import dynamic from "next/dynamic"

const LocationPicker = dynamic(() => import("@/components/ui/location-picker"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-muted animate-pulse rounded-md">Loading Map...</div>
})

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending ? "Saving..." : "Save Expense"}
        </Button>
    )
}

interface ExpenseFormProps {
    trips: Array<{
        id: string
        tripNumber: string
        name: string
        status: string
    }>
    selectedTrip?: {
        id: string
        name: string
        description: string | null
    } | null
    initialData?: {
        id: string
        merchant: string
        amount: number
        date: string
        currency: string
        category: string
        tripId?: string | null
        latitude?: number | null
        longitude?: number | null
    } | null
    initialFile?: File | null
    onCancel?: () => void
    onSuccess?: () => void
}

interface FormState {
    message?: string
    status?: string
    existingId?: string
    error?: string
}

const initialState: FormState = {
    message: "",
    status: "IDLE",
    existingId: "",
    error: ""
}

const CATEGORIES = [
    { value: "Travel", label: "Travel" },
    { value: "Meals", label: "Meals" },
    { value: "Software", label: "Software" },
    { value: "Office Supplies", label: "Office Supplies" },
    { value: "Marketing", label: "Marketing" },
    { value: "Other", label: "Other (Custom)" },
]

export function ExpenseForm({ trips, selectedTrip, initialData, initialFile, onCancel, onSuccess }: ExpenseFormProps) {
    // Form State
    const [merchant, setMerchant] = useState(initialData?.merchant || "")
    const [amount, setAmount] = useState(initialData?.amount ? SafeMath.toDollars(initialData.amount).toString() : "")
    const [date, setDate] = useState(
        initialData?.date
            ? new Date(initialData.date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
    )
    const [currency, setCurrency] = useState(initialData?.currency || "USD")
    const [category, setCategory] = useState<string>(initialData?.category || "")
    const [customCategory, setCustomCategory] = useState("")
    const [openCategory, setOpenCategory] = useState(false)

    // Refs for Focus Management
    const merchantInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus logic
    useEffect(() => {
        if (!initialFile && !initialData) {
            // Slight delay to ensure modal animation clears
            setTimeout(() => merchantInputRef.current?.focus(), 100)
        }
    }, [initialFile, initialData])


    // Location State
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
        initialData?.latitude && initialData?.longitude
            ? { lat: initialData.latitude, lng: initialData.longitude }
            : null
    )
    const [locationError, setLocationError] = useState<string | null>(null)
    const [showMapPicker, setShowMapPicker] = useState(false)

    useEffect(() => {
        if (location) return;

        setLocationError("Acquiring GPS...")
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                    setLocationError(null)
                },
                (error) => {
                    console.warn("GPS Error:", error)
                    setLocationError("GPS failed. Try picking on map.")
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        } else {
            setLocationError("Geolocation not supported")
        }
    }, [])

    const retryGPS = () => {
        setLocationError("Retrying GPS...")
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
                setLocationError(null)
            },
            (error) => setLocationError("GPS failed. Please stick to Manual Map."),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocation({ lat, lng })
        setLocationError(null)
        setShowMapPicker(false)
    }

    // Duplicate Resolution State
    const [force, setForce] = useState(false)
    const [replaceId, setReplaceId] = useState(initialData?.id || "")
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const [state, formAction, isPending] = useActionState<FormState, FormData>(createExpense, initialState)
    const { isOnline, saveExpenseOffline } = useOffline()

    // UI State
    const [isScanning, setIsScanning] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const searchParams = useSearchParams()
    const preSelectedTripId = searchParams.get('tripId') || initialData?.tripId

    useEffect(() => {
        if (state?.status === "DUPLICATE") {
            setShowDuplicateDialog(true)
        } else if (state?.status === "SUCCESS") {
            toast.success("Expense saved successfully")
            if (onSuccess) onSuccess()
        } else if (state?.error) {
            alert(state.error)
        }
    }, [state, onSuccess])

    const handleDuplicateResponse = (action: 'force' | 'replace' | 'cancel') => {
        setShowDuplicateDialog(false)
        if (action === 'cancel') return

        if (action === 'force') {
            setForce(true)
            setTimeout(() => formRef.current?.requestSubmit(), 0)
        } else if (action === 'replace' && state?.existingId) {
            setReplaceId(state.existingId)
            setTimeout(() => formRef.current?.requestSubmit(), 0)
        }
    }

    const processFile = async (file: File) => {
        if (!isOnline) {
            toast.info("Offline Code: Receipt scanning unavailable.", {
                description: "Attached receipt will be saved offline. Please enter details manually."
            })
            return
        }

        setIsScanning(true)

        // function to perform upload
        const performScan = async (fileToUpload: File | Blob) => {
            const formData = new FormData()
            formData.append("file", fileToUpload)

            const response = await fetch("/api/scan-receipt", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                if (response.status === 422) {
                    throw new Error("HEIC_DETECTED");
                }
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    errorData = { error: `Server Error (${response.status}): ${text.slice(0, 100)}...` };
                }
                throw errorData;
            }
            return response.json();
        }

        try {
            toast.loading("Scanning receipt with AI...", { id: "scan-progress" });

            // Upload directly - server handles image processing
            const data = await performScan(file);
            toast.dismiss("scan-progress");
            toast.success("Receipt scanned!");

            // Auto-fill form
            if (data.merchant) setMerchant(data.merchant)
            if (data.amount) setAmount(data.amount.toString())
            if (data.date) setDate(data.date)
            if (data.currency) setCurrency(data.currency)
            if (data.category) {
                const validCategories = ["Travel", "Meals", "Software", "Office Supplies", "Marketing"]
                if (validCategories.includes(data.category)) {
                    setCategory(data.category)
                } else {
                    setCategory("Other")
                }
            }

        } catch (error: any) {
            console.error("Scanning Error:", error);

            let msg = "Failed to scan receipt.";
            if (error?.error) {
                msg = error.error;
            } else if (error instanceof Error) {
                msg = error.message;
            } else if (typeof error === 'string') {
                msg = error;
            }

            toast.dismiss("scan-progress");
            toast.error(msg, { duration: 5000 });
        } finally {
            setIsScanning(false)
        }
    }

    useEffect(() => {
        if (initialFile) {
            processFile(initialFile)
        }
    }, [initialFile])

    const handleScanClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
    }

    const handleSubmit = async (formData: FormData) => {
        if (!category) {
            toast.error("Please select a category");
            return;
        }

        // Inject category value from state because simple Select might not propagate if controlled this way
        // But we have hidden input trick or standard FormData behavior for Input, but for Command?
        // Command doesn't submit a value automatically. We need a hidden input.
        formData.set("categorySelect", category);

        if (!isOnline) {
            const merchantVal = formData.get('merchant') as string
            const amountVal = parseFloat(formData.get('amount') as string)

            let categoryVal = category;
            const customCategoryVal = formData.get('customCategory') as string
            if (categoryVal === "Other" && customCategoryVal) {
                categoryVal = customCategoryVal
            }

            const dateVal = new Date(formData.get('date') as string)
            const file = formData.get('file') as File

            let loc = null
            const lat = formData.get('latitude')
            const lng = formData.get('longitude')
            if (lat && lng) {
                loc = { latitude: parseFloat(lat as string), longitude: parseFloat(lng as string) }
            }

            const tripId = formData.get('tripId') as string

            await saveExpenseOffline({
                merchant: merchantVal,
                amount: amountVal,
                date: dateVal,
                category: categoryVal,
                tripId: tripId && tripId !== 'none' ? tripId : undefined,
                receiptImage: file.size > 0 ? file : null,
                location: loc,
            })

            // Reset Form UI
            setMerchant("")
            setAmount("")
            setDate(new Date().toISOString().slice(0, 10))
            setCategory("")
            setCustomCategory("")
            setLocation(null)
            if (fileInputRef.current) fileInputRef.current.value = ""

            if (onSuccess) onSuccess()
            return
        }
        return formAction(formData)
    }

    return (
        // STITCH DESIGN UPDATE - BALANCED
        // The main form is now a hidden form that collects values from controlled components
        // The visible UI is built with individual cards and buttons.
        <div className="flex flex-col h-full w-full max-w-md mx-auto bg-[#FBF7F2] rounded-[32px] overflow-hidden relative font-sans text-slate-800">
            {/* Top Navigation (Visual) */}
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
                {onCancel ? (
                    <button onClick={onCancel} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                ) : (
                    <div className="w-10" /> // Spacer
                )}
                <span className="text-sm font-bold tracking-widest text-[#7C7CAA] uppercase">New Expense</span>
                <button className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors">
                    <MoreHorizontal className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            {/* Scrollable Content - Balanced Spacing with Extra Bottom Padding */}
            <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-40 no-scrollbar">

                {/* 1. Amount Card */}
                <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm shrink-0">
                    <div className="relative flex items-center justify-center gap-1 mb-3">
                        <span className="text-3xl font-medium text-slate-400">$</span>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="text-6xl font-bold text-slate-700 text-center border-none shadow-none focus-visible:ring-0 p-0 w-auto max-w-[200px] h-auto placeholder:text-slate-200"
                            autoFocus
                        />
                    </div>
                    <div className="bg-[#EFEEFC] text-[#5D5FEF] px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-[#E0DFF8] transition-colors">
                        {currency} <ChevronDown className="w-3 h-3" />
                    </div>
                </div>

                {/* 2. Merchant Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3 shrink-0">
                    <Label className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase pl-1">Merchant</Label>
                    <div className="relative">
                        <Input
                            value={merchant}
                            onChange={(e) => setMerchant(e.target.value)}
                            placeholder="Netflix, Starbucks, etc."
                            className="bg-[#F9FAFB] border-none text-base h-12 pl-4 pr-10 rounded-xl text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/20"
                        />
                        <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    </div>
                    {/* Quick Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {["Netflix", "Uber", "Apple", "Spotify"].map((brand) => (
                            <button
                                key={brand}
                                type="button"
                                onClick={() => setMerchant(brand)}
                                className="px-3 py-1.5 bg-[#F9FAFB] hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition-colors whitespace-nowrap"
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Category & Date Split Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm shrink-0">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                        {/* Category */}
                        <div className="space-y-2 pr-2">
                            <Label className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase pl-1">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full border-none shadow-none bg-[#F9FAFB] rounded-xl text-slate-700 font-medium h-11 focus:ring-0">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Date */}
                        <div className="space-y-2 pl-4">
                            <Label className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase pl-1">Date</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={date ? date.slice(0, 10) : ''}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="border-none shadow-none bg-[#F9FAFB] rounded-xl text-slate-700 font-medium h-11 w-full px-3 text-sm focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Custom Category Input */}
                    {category === "Other" && (
                        <div className="mt-3 pt-3 border-t border-slate-50 animate-in fade-in">
                            <Input
                                placeholder="Enter custom category..."
                                value={customCategory}
                                onChange={e => setCustomCategory(e.target.value)}
                                className="bg-[#F9FAFB] border-none h-11"
                            />
                        </div>
                    )}
                </div>

                {/* 4. Note Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm space-y-2 shrink-0">
                    <Label className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase pl-1">Note</Label>
                    <div className="relative">
                        <Input
                            placeholder="Add details..."
                            className="bg-[#F9FAFB] border-none text-base h-12 pl-4 pr-10 rounded-xl text-slate-700 placeholder:text-slate-400 focus-visible:ring-0"
                        />
                        <Edit3 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    </div>
                </div>

            </div>

            {/* Bottom Fixed Actions - Floating Buttons (No Panel) */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 space-y-3 z-20 pointer-events-none bg-gradient-to-t from-[#FBF7F2]/90 via-[#FBF7F2]/50 to-transparent">

                {/* Scan Button - Large Orange */}
                <Button
                    type="button"
                    onClick={handleScanClick}
                    className="w-full h-12 bg-[#FF6700] hover:bg-[#E65D00] text-white rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-base font-bold transition-transform active:scale-[0.98] pointer-events-auto"
                >
                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                    Scan Receipt (Auto-Scan)
                </Button>

                {/* Second Row: Reset + Save */}
                <div className="flex gap-3 pointer-events-auto">
                    {/* Reset Button */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setAmount("")
                            setMerchant("")
                            setCategory("")
                            setDate(new Date().toISOString().slice(0, 10))
                        }}
                        className="h-12 w-12 rounded-2xl bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-100 flex-shrink-0"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>

                    {/* Save Button */}
                    <Button
                        onClick={() => formRef.current?.requestSubmit()} // Trigger the hidden form submission
                        disabled={isPending}
                        className="flex-1 h-12 bg-[#5D5FEF] hover:bg-[#4B4DCE] text-white rounded-2xl shadow-lg shadow-indigo-500/20 text-base font-bold transition-transform active:scale-[0.98]"
                    >
                        {isPending ? "Saving..." : "Save Expense"}
                    </Button>
                </div>
            </div>

            {/* Hidden form to collect all controlled component values for submission */}
            <form ref={formRef} action={handleSubmit} className="hidden">
                <input type="hidden" name="force" value={force.toString()} />
                <input type="hidden" name="replaceId" value={replaceId} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="merchant" value={merchant} />
                <input type="hidden" name="categorySelect" value={category} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="currency" value={currency} />
                <input type="hidden" name="customCategory" value={customCategory} />
                {location && (<><input type="hidden" name="latitude" value={location.lat} /><input type="hidden" name="longitude" value={location.lng} /></>)}
                <input type="file" name="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </form>

            {/* Dialogs */}
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Detected</DialogTitle>
                        <DialogDescription>
                            We found a similar expense for <strong>{merchant}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-start gap-2">
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <Button variant="destructive" onClick={() => handleDuplicateResponse('replace')}>Replace Old</Button>
                            <Button onClick={() => handleDuplicateResponse('force')}>Add Anyway</Button>
                            <Button variant="outline" onClick={() => handleDuplicateResponse('cancel')}>Cancel</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
                <DialogContent className="max-w-3xl h-[90vh] md:h-auto">
                    <DialogHeader><DialogTitle>Pick Location</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <LocationPicker initialLat={location?.lat} initialLng={location?.lng} onSelect={handleLocationSelect} onCancel={() => setShowMapPicker(false)} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
