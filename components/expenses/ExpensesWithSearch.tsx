"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";
import { executeSearch, getSavedSearches, createSavedSearch } from "@/app/actions/saved-searches";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Expense {
    id: string;
    date: Date;
    merchant: string;
    category: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl: string | null;
    tripId: string | null;
    reconciliationStatus: string;
    user: { name: string | null; email: string | null };
    trip: { name: string } | null;
}

interface SavedSearch {
    id: string;
    name: string;
    queryString: string;
    isShared: boolean;
    isPinned: boolean;
}

interface ExpensesWithSearchProps {
    initialExpenses: Expense[];
    userRole: string;
}

export function ExpensesWithSearch({ initialExpenses, userRole }: ExpensesWithSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [activeQuery, setActiveQuery] = useState(searchParams.get("q") || "");
    const [isSearching, setIsSearching] = useState(false);

    // Load saved searches on mount
    useEffect(() => {
        async function loadSavedSearches() {
            try {
                const searches = await getSavedSearches("EXPENSE");
                // Map to expected format
                const mapped = searches.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    queryString: s.queryString,
                    isShared: s.isShared,
                    isPinned: s.isPinned,
                }));
                setSavedSearches(mapped);
            } catch (error) {
                console.error("Failed to load saved searches:", error);
            }
        }
        loadSavedSearches();
    }, []);

    // Execute search when query changes
    const handleSearch = async (query: string) => {
        setActiveQuery(query);
        setIsSearching(true);

        try {
            if (!query.trim()) {
                // Reset to initial expenses
                setExpenses(initialExpenses);
                // Update URL
                router.push("/expenses", { scroll: false });
            } else {
                const result = await executeSearch(query, { type: "expense" });
                if (result.errors && result.errors.length > 0) {
                    console.error("Search errors:", result.errors);
                    setExpenses(initialExpenses);
                } else {
                    setExpenses(result.results as Expense[]);
                    // Update URL with query
                    router.push(`/expenses?q=${encodeURIComponent(query)}`, { scroll: false });
                }
            }
        } catch (error) {
            console.error("Search failed:", error);
            setExpenses(initialExpenses);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle saved search selection
    const handleSelectSavedSearch = (search: SavedSearch) => {
        handleSearch(search.queryString);
    };

    const handleSaveSearch = async (query: string, name: string) => {
        try {
            const saved = await createSavedSearch({
                name,
                queryString: query,
                typeScope: "EXPENSE",
                isPinned: false,
                isShared: false
            });

            // Add to local state
            setSavedSearches(prev => [
                {
                    id: saved.id,
                    name: saved.name,
                    queryString: saved.queryString,
                    isShared: saved.isShared,
                    isPinned: saved.isPinned
                },
                ...prev
            ]);

            toast.success("Search saved successfully");
        } catch (error) {
            console.error("Failed to save search:", error);
            toast.error("Failed to save search");
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <SearchBar
                value={activeQuery}
                onChange={setActiveQuery}
                onSearch={handleSearch}
                onSave={handleSaveSearch}
                savedSearches={savedSearches}
                onSelectSaved={(search) => handleSearch(search.queryString)}
                placeholder="Search expenses... (e.g., status:pending amount>100)"
            />

            {/* Results indicator */}
            {activeQuery && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    {isSearching ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            Found <span className="font-semibold">{expenses.length}</span> results
                            {activeQuery && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                    {activeQuery}
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Expenses Table */}
            <ExpensesTable expenses={expenses as any} userRole={userRole} />
        </div>
    );
}

