"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Filter, X, Save, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { getAutocompleteSuggestions, parseQuery } from "@/lib/search";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    onSave?: (query: string, name: string) => void;
    placeholder?: string;
    savedSearches?: Array<{ id: string; name: string; queryString: string; isPinned: boolean }>;
    onSelectSaved?: (search: { id: string; queryString: string }) => void;
}

export function SearchBar({
    value,
    onChange,
    onSearch,
    onSave,
    placeholder = "Search expenses... (try status:pending or amount>100)",
    savedSearches = [],
    onSelectSaved,
}: SearchBarProps) {
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedValue = useDebounce(value, 200);

    // Update suggestions on input change
    useEffect(() => {
        if (debouncedValue) {
            const newSuggestions = getAutocompleteSuggestions(debouncedValue, cursorPosition);
            setSuggestions(newSuggestions);
            setShowAutocomplete(newSuggestions.length > 0);

            // Validate query
            const { errors: queryErrors } = parseQuery(debouncedValue);
            setErrors(queryErrors);
        } else {
            setSuggestions([]);
            setShowAutocomplete(false);
            setErrors([]);
        }
    }, [debouncedValue, cursorPosition]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setCursorPosition(e.target.selectionStart || 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setShowAutocomplete(false);
            onSearch(value);
        }
        if (e.key === "Escape") {
            setShowAutocomplete(false);
        }
    };

    const handleSuggestionSelect = (suggestion: string) => {
        // Replace the last "word" with the suggestion
        const words = value.split(/\s+/);
        words[words.length - 1] = suggestion;
        const newValue = words.join(" ") + " ";
        onChange(newValue);
        setShowAutocomplete(false);
        inputRef.current?.focus();
    };

    const handleClear = () => {
        onChange("");
        setErrors([]);
        onSearch("");
    };

    const activeFilters = parseQuery(value).filters;

    return (
        <div className="relative w-full">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={value}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setShowAutocomplete(true)}
                        onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                        placeholder={placeholder}
                        className="pl-10 pr-10"
                    />
                    {value && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Autocomplete dropdown */}
                    {showAutocomplete && suggestions.length > 0 && (
                        <div
                            className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg"
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in dropdown
                        >
                            <div className="py-1">
                                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                    Suggestions
                                </div>
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSuggestionSelect(suggestion)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Button onClick={() => onSearch(value)} size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>

                {onSave && value && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const name = window.prompt("Save search as:");
                            if (name) onSave(value, name);
                        }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                )}

                {/* Saved searches popover */}
                {savedSearches.length > 0 && onSelectSaved && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Saved
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="end">
                            <div className="space-y-1">
                                <div className="text-sm font-medium mb-2">Saved Searches</div>
                                {savedSearches.map((search) => (
                                    <button
                                        key={search.id}
                                        onClick={() => onSelectSaved(search)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left text-sm"
                                    >
                                        {search.isPinned && <Pin className="h-3 w-3 text-primary" />}
                                        <span className="truncate flex-1">{search.name}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Error messages */}
            {errors.length > 0 && (
                <div className="mt-2 text-sm text-destructive">
                    {errors.map((error, i) => (
                        <div key={i}>{error}</div>
                    ))}
                </div>
            )}

            {/* Active filters badges */}
            {activeFilters.length > 0 && errors.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {activeFilters.map((filter, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                            {filter.negated && "-"}
                            {filter.field}:{filter.values.join(",")}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
