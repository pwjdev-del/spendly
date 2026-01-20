import {
    Utensils, Car, ShoppingBag, Receipt, Plane, Coffee,
    Smartphone, Wifi, Home, Zap, Heart, Briefcase,
    Monitor, Music, Video, Gamepad, Gift,
    CreditCard, Banknote, Landmark, Shield, AlertCircle,
    Bus, Train, Fuel, Wrench, Hammer, HardHat,
    Shirt, Watch, Glasses, Scissors, Stethoscope,
    GraduationCap, BookOpen, Library,
    Apple, Cherry, Grape, Croissant, Pizza, Beer, Wine,
    Laptop, Mouse, Printer, Server, Cloud
} from "lucide-react"

export function getExpenseIcon(category: string, merchant: string) {
    // Normalize inputs
    const cat = category?.toLowerCase() || "";
    const mer = merchant?.toLowerCase() || "";

    // 1. Check Merchant Specifics first (for "unique" feel)
    if (mer.includes("uber") || mer.includes("lyft")) return { icon: Car, color: "text-zinc-400", bg: "bg-zinc-400/10" };
    if (mer.includes("starbucks") || mer.includes("dunkin")) return { icon: Coffee, color: "text-amber-600", bg: "bg-amber-600/10" };
    if (mer.includes("amazon") || mer.includes("prime")) return { icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (mer.includes("apple") || mer.includes("itunes")) return { icon: Apple, color: "text-zinc-500", bg: "bg-zinc-500/10" };
    if (mer.includes("netflix") || mer.includes("spotify")) return { icon: Music, color: "text-red-500", bg: "bg-red-500/10" };
    if (mer.includes("delta") || mer.includes("united") || mer.includes("american air")) return { icon: Plane, color: "text-sky-600", bg: "bg-sky-600/10" };
    if (mer.includes("airbnb") || mer.includes("hotel")) return { icon: Home, color: "text-rose-500", bg: "bg-rose-500/10" };
    if (mer.includes("slack") || mer.includes("zoom")) return { icon: Radio, color: "text-purple-500", bg: "bg-purple-500/10" };

    // 2. Check Categories
    if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant")) return { icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (cat.includes("transport") || cat.includes("travel") || cat.includes("fuel") || cat.includes("gas")) return { icon: Car, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (cat.includes("shopping") || cat.includes("clothing") || cat.includes("retail")) return { icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-500/10" };
    if (cat.includes("tech") || cat.includes("software") || cat.includes("hardware") || cat.includes("electronics")) return { icon: Laptop, color: "text-indigo-500", bg: "bg-indigo-500/10" };
    if (cat.includes("utilities") || cat.includes("bill") || cat.includes("electric")) return { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (cat.includes("health") || cat.includes("medical") || cat.includes("care")) return { icon: Heart, color: "text-red-400", bg: "bg-red-400/10" };
    if (cat.includes("education") || cat.includes("course") || cat.includes("book")) return { icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" };
    if (cat.includes("entertainment") || cat.includes("movie") || cat.includes("fun")) return { icon: Gamepad, color: "text-purple-500", bg: "bg-purple-500/10" };
    if (cat.includes("drink") || cat.includes("bar") || cat.includes("liquor")) return { icon: Wine, color: "text-rose-600", bg: "bg-rose-600/10" };

    // Default
    return { icon: Receipt, color: "text-slate-500", bg: "bg-slate-500/10" };
}

// Fallback Generic Icon
function Radio(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
        </svg>
    )
}
