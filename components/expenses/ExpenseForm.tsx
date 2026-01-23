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
import { Camera, Check, ChevronsUpDown, Loader2, MapPin, ArrowLeft, MoreHorizontal, Store, Edit3, ScanLine, RotateCcw, ChevronDown, X } from "lucide-react"
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
    isSlideOver?: boolean
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

export function ExpenseForm({ trips, selectedTrip, initialData, initialFile, onCancel, onSuccess, isSlideOver }: ExpenseFormProps) {
    // State
    const [step, setStep] = useState<'AMOUNT' | 'DETAILS'>(initialFile || initialData ? 'DETAILS' : 'AMOUNT')

    // ... existing state ...
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
    const [openCurrency, setOpenCurrency] = useState(false)

    // Refs for Focus Management
    const merchantInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus logic
    useEffect(() => {
        if (!initialFile && !initialData && step === 'DETAILS') { // Only auto-focus merchant if on details step
            // Slight delay to ensure modal animation clears
            setTimeout(() => merchantInputRef.current?.focus(), 100)
        }
    }, [initialFile, initialData, step])


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

    const [state, formAction, isPending] = useActionState<FormState, FormData>(createExpense as any, initialState)
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
                let errorMessage = `Server Error (${response.status})`;
                try {
                    const errorData = JSON.parse(text);
                    // Ensure we extract a meaningful error message
                    if (errorData?.error) {
                        errorMessage = errorData.error;
                    } else if (errorData?.message) {
                        errorMessage = errorData.message;
                    } else if (errorData?.detail) {
                        errorMessage = errorData.detail;
                    } else if (text && text !== '{}') {
                        errorMessage = `Server Error (${response.status}): ${text.slice(0, 100)}`;
                    }
                } catch {
                    if (text) {
                        errorMessage = `Server Error (${response.status}): ${text.slice(0, 100)}`;
                    }
                }
                throw new Error(errorMessage);
            }
            return response.json();
        }

        try {
            toast.loading("Scanning receipt with AI...", { id: "scan-progress" });

            // Upload directly - server handles image processing
            const data = await performScan(file);
            toast.dismiss("scan-progress");
            toast.success("Receipt scanned!");

            // Ensure we switch to DETAILS after scan
            if (data) {
                setStep('DETAILS')
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

    const handleContinue = () => {
        // If user entered nothing, maybe allow them to proceed to enter 0?
        // But usually we want an amount.
        // If amount is empty string, we can set it to '0' or just let them go.
        // Let's require amount if they click Continue, or at least it transitions.
        // Actually, let's just transition.
        setStep('DETAILS')
    }

    // Step 1: Amount UI
    // Only show if we are in AMOUNT step AND we don't have initial data (editing mode skips this)
    if (step === 'AMOUNT' && !initialData) {
        return (
            <div className="flex flex-col h-full w-full bg-background text-foreground p-6 justify-between animate-in fade-in slide-in-from-right-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between">
                    {onCancel && (
                        <button onClick={onCancel} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
                            {isSlideOver ? <X className="w-6 h-6 text-slate-400" /> : <ArrowLeft className="w-6 h-6 text-slate-400" />}
                        </button>
                    )}
                    <span className="text-sm font-bold tracking-widest text-[#2DD4BF] uppercase mx-auto">New Expense</span>
                    {onCancel && <div className="w-10" />}
                </div>

                {/* Center: Amount Input */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-light text-slate-400">$</span>
                        <Input
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="text-8xl font-light text-white text-center border-none shadow-none focus-visible:ring-0 p-0 w-auto max-w-[300px] h-auto bg-transparent placeholder:text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                        />
                    </div>

                    <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                role="combobox"
                                aria-expanded={openCurrency}
                                className="bg-primary/10 text-primary px-4 py-2 h-auto rounded-full text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-primary/20 transition-colors hover:text-primary"
                            >
                                {currency} <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0 bg-card border-border">
                            <Command className="bg-card">
                                <CommandInput placeholder="Search currency..." className="h-9 text-white" />
                                <CommandList>
                                    <CommandEmpty>No currency found.</CommandEmpty>
                                    <CommandGroup>
                                        {CURRENCIES.map((c) => (
                                            <CommandItem
                                                key={c.value}
                                                value={c.value}
                                                onSelect={(currentValue) => {
                                                    const matched = CURRENCIES.find(item => item.value.toLowerCase() === currentValue.toLowerCase())
                                                    if (matched) {
                                                        setCurrency(matched.value)
                                                    }
                                                    setOpenCurrency(false)
                                                }}
                                                className="aria-selected:bg-secondary"
                                            >
                                                {c.label}
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        currency === c.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Bottom: Actions */}
                <div className="space-y-4 pb-8">
                    <Button
                        onClick={handleContinue}
                        className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-lg font-bold"
                    >
                        Continue
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-700/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleScanClick}
                        className="w-full h-14 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-full flex items-center justify-center gap-2 text-base font-semibold"
                    >
                        {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5 text-[#2DD4BF]" />}
                        Scan Receipt with AI
                    </Button>
                </div>

                {/* Hidden File Input */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
        )
    }

    return (
        // STITCH DESIGN UPDATE - BALANCED
        // The main form is now a hidden form that collects values from controlled components
        // The visible UI is built with individual cards and buttons.
        <div className="flex flex-col h-full w-full bg-background overflow-hidden relative font-sans text-foreground">
            {/* Top Navigation */}
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
                {onCancel ? (
                    <button onClick={onCancel} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-400" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
                <span className="text-sm font-bold tracking-widest text-primary uppercase">New Expense</span>
                <button className="p-2 -mr-2 hover:bg-secondary rounded-full transition-colors">
                    <MoreHorizontal className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            {/* Scrollable Content - Balanced Spacing with Extra Bottom Padding */}
            <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-40 no-scrollbar">

                {/* 1. Amount Card */}
                <div className="bg-card rounded-3xl p-8 flex flex-col items-center justify-center border border-border shrink-0">
                    <div className="relative flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl font-light text-slate-400">$</span>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="text-6xl font-light text-foreground text-center border-none shadow-none focus-visible:ring-0 p-0 w-auto max-w-[200px] h-auto bg-transparent placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <div className="flex flex-col gap-1 text-slate-500">
                            <ChevronDown className="w-4 h-4 rotate-180" />
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                    <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                role="combobox"
                                aria-expanded={openCurrency}
                                className="bg-primary text-primary-foreground px-5 py-2 h-auto rounded-full text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                {currency} <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0 bg-card border-border">
                            <Command className="bg-card">
                                <CommandInput placeholder="Search currency..." className="h-9 text-white" />
                                <CommandList>
                                    <CommandEmpty>No currency found.</CommandEmpty>
                                    <CommandGroup>
                                        {CURRENCIES.map((c) => (
                                            <CommandItem
                                                key={c.value}
                                                value={c.value}
                                                onSelect={(currentValue) => {
                                                    const matched = CURRENCIES.find(item => item.value.toLowerCase() === currentValue.toLowerCase())
                                                    if (matched) {
                                                        setCurrency(matched.value)
                                                    }
                                                    setOpenCurrency(false)
                                                }}
                                                className="aria-selected:bg-secondary"
                                            >
                                                {c.label}
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        currency === c.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 2. Merchant Card */}
                <div className="bg-card rounded-3xl p-5 border border-border space-y-3 shrink-0">
                    <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase pl-1">Merchant</Label>
                    <div className="relative">
                        <Input
                            value={merchant}
                            onChange={(e) => setMerchant(e.target.value)}
                            placeholder="Netflix, Starbucks, etc."
                            className="bg-secondary border-none text-base h-12 pl-4 pr-10 rounded-xl placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                        />
                        <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    </div>
                    {/* Quick Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {["Netflix", "Uber", "Apple", "Spotify"].map((brand) => (
                            <button
                                key={brand}
                                type="button"
                                onClick={() => setMerchant(brand)}
                                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border border-transparent hover:border-primary/20"
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Category & Date Split Card */}
                <div className="bg-card rounded-3xl p-5 border border-border shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase pl-1">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full border-none shadow-none bg-secondary rounded-xl font-medium h-11 focus:ring-0">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Date */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase pl-1">Date</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={date ? date.slice(0, 10) : ''}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="border-none shadow-none bg-secondary rounded-xl font-medium h-11 w-full px-3 text-sm focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Custom Category Input */}
                    {category === "Other" && (
                        <div className="mt-3 pt-3 border-t border-[#1E3A5F] animate-in fade-in">
                            <Input
                                placeholder="Enter custom category..."
                                value={customCategory}
                                onChange={e => setCustomCategory(e.target.value)}
                                className="bg-secondary border-none h-11"
                            />
                        </div>
                    )}
                </div>

                {/* 4. Note Card */}
                <div className="bg-card rounded-3xl p-5 border border-border space-y-2 shrink-0">
                    <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase pl-1">Note</Label>
                    <div className="relative">
                        <Input
                            placeholder="Add details..."
                            className="bg-secondary border-none text-base h-12 pl-4 pr-10 rounded-xl placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                        <Edit3 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                </div>

            </div>

            {/* Bottom Fixed Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 space-y-3 z-20 pointer-events-none bg-gradient-to-t from-background via-background/80 to-transparent">

                {/* Scan Button - Cyan */}
                <Button
                    type="button"
                    onClick={handleScanClick}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-base font-bold transition-transform active:scale-[0.98] pointer-events-auto"
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
                        className="h-12 w-12 rounded-2xl bg-card text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm border border-border flex-shrink-0"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>

                    {/* Save Button */}
                    <Button
                        onClick={() => formRef.current?.requestSubmit()}
                        disabled={isPending}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 text-base font-bold transition-transform active:scale-[0.98]"
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
        </div >
    )
}

const CURRENCIES = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "INR", label: "INR (₹)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CNY", label: "CNY (¥)" },
]
