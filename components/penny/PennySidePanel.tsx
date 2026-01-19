"use client"

import { useState, useRef, useEffect } from "react"
import { askData, createExpenseFromPenny } from "@/app/actions/ai-analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, User, Bot, CheckCircle2, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { usePenny } from "./PennyContext"
import { cn } from "@/lib/utils"
import { DocumentUpload } from "./DocumentUpload"

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
    action?: {
        type: string
        status: 'pending' | 'success' | 'error'
        data?: any
    }
}

// Parse AI response for action commands
function parseActionFromResponse(response: string): { action: string; params: any; cleanResponse: string } | null {
    // Match [ACTION:TYPE]{...json...} pattern
    const match = response.match(/\[ACTION:(\w+)\](\{[^}]+\})/)
    if (match) {
        try {
            const params = JSON.parse(match[2])
            const cleanResponse = response.replace(/\[ACTION:\w+\]\{[^}]+\}/, '').trim()
            return { action: match[1], params, cleanResponse }
        } catch {
            return null
        }
    }
    return null
}

export function PennyChat({ className }: { className?: string }) {
    const { close } = usePenny()
    const [query, setQuery] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleAsk = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim() || isLoading) return

        const userMsg = query
        setQuery("")
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const result = await askData(userMsg)
            if (result.error) {
                toast.error(result.error)
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error analyzing your data." }])
            } else {
                const response = result.answer || "I couldn't find an answer."

                // Check for action commands
                const actionCommand = parseActionFromResponse(response)

                if (actionCommand?.action === 'CREATE_EXPENSE') {
                    // Show pending message
                    const displayText = actionCommand.cleanResponse ||
                        `Creating expense: $${actionCommand.params.amount} at ${actionCommand.params.merchant}`

                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: displayText,
                        action: { type: 'CREATE_EXPENSE', status: 'pending', data: actionCommand.params }
                    }])

                    // Execute the action
                    const expenseResult = await createExpenseFromPenny(actionCommand.params)

                    if (expenseResult.success) {
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastMsg = updated[updated.length - 1]
                            if (lastMsg.action) {
                                lastMsg.action.status = 'success'
                                lastMsg.content = `Done! I've added a $${actionCommand.params.amount} expense at ${actionCommand.params.merchant} (${actionCommand.params.category || 'General'}).`
                            }
                            return updated
                        })
                        toast.success("Expense created!")
                    } else {
                        setMessages(prev => {
                            const updated = [...prev]
                            const lastMsg = updated[updated.length - 1]
                            if (lastMsg.action) {
                                lastMsg.action.status = 'error'
                                lastMsg.content = `Sorry, I couldn't create that expense: ${expenseResult.error}`
                            }
                            return updated
                        })
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: response }])
                }
            }
        } catch (error) {
            toast.error("Failed to connect to AI")
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] flex items-center justify-center shadow-lg shadow-[#2DD4BF]/30">
                        <Sparkles className="h-5 w-5 text-[#0A1628]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Penny</h2>
                        <p className="text-xs text-muted-foreground">Your personal AI assistant</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={close}>
                    <X className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8 space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-[#2DD4BF]/20 to-[#0D9488]/20 flex items-center justify-center">
                                <Bot className="h-8 w-8 opacity-60" />
                            </div>
                            <p className="font-medium">Hi! I'm Penny 👋</p>
                            <p className="text-xs text-muted-foreground/80">
                                I can help with expenses, trips, budgets, and more!
                            </p>

                            {/* Document Upload Section */}
                            <DocumentUpload onUploadComplete={(expense) => {
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: `Great! I've created an expense for $${expense.amount} at ${expense.merchant}.`
                                }])
                            }} />

                            <div className="pt-2">
                                <p className="text-xs font-medium mb-2 text-foreground/70">Or try asking:</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {[
                                        "Am I over budget?",
                                        "My trip expenses",
                                        "Add $15 lunch",
                                        "Spending prediction"
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setQuery(suggestion)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-[#2DD4BF]/20">
                                    <Sparkles className="h-3.5 w-3.5 text-[#0A1628]" />
                                </div>
                            )}
                            <div className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] shadow-sm",
                                m.role === 'user'
                                    ? 'bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] text-[#0A1628]'
                                    : 'bg-card border'
                            )}>
                                <span>{m.content}</span>
                                {m.action && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                                        {m.action.status === 'pending' && (
                                            <span className="text-muted-foreground animate-pulse">Processing...</span>
                                        )}
                                        {m.action.status === 'success' && (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Created
                                            </span>
                                        )}
                                        {m.action.status === 'error' && (
                                            <span className="text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Failed
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {m.role === 'user' && (
                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                                    <User className="h-3.5 w-3.5" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="h-3.5 w-3.5 text-[#0A1628] animate-spin" />
                            </div>
                            <div className="bg-card border rounded-2xl px-4 py-2.5">
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Form */}
            <form
                onSubmit={handleAsk}
                className="p-4 border-t bg-background flex gap-2 shrink-0"
                suppressHydrationWarning
            >
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask Penny anything..."
                    className="flex-1 rounded-full"
                    disabled={isLoading}
                    suppressHydrationWarning
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !query.trim()}
                    className="rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] hover:from-[#14B8A6] hover:to-[#0F766E] text-[#0A1628]"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}

// Mobile Sheet Wrapper
export function PennySheet() {
    const { isOpen, close } = usePenny()

    return (
        <Sheet modal={false} open={isOpen} onOpenChange={(open) => !open && close()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col bg-background shadow-xl border-l"
            >
                <PennyChat className="h-full" />
            </SheetContent>
        </Sheet>
    )
}

// Backwards compatibility default export
export function PennySidePanel() {
    return <PennySheet />
}
