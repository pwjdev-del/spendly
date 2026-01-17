"use client"

import { useState, useRef, useEffect } from "react"
import { askData } from "@/app/actions/ai-analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, User, Bot } from "lucide-react"
import { toast } from "sonner"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function AskDataWidget() {
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
                setMessages(prev => [...prev, { role: 'assistant', content: result.answer || "I couldn't find an answer." }])
            }
        } catch (error) {
            toast.error("Failed to connect to AI")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Ask Penny</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-3" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
                            <Bot className="h-8 w-8 mx-auto opacity-50" />
                            <p>Ask me about your spending!</p>
                            <p className="text-xs">"How much spent on Food?"</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                </div>
                            )}
                            <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${m.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                                }`}>
                                {m.content}
                            </div>
                            {m.role === 'user' && (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                                    <User className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs ml-8">
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleAsk} className="p-3 border-t bg-muted/10 flex gap-2" suppressHydrationWarning>
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1"
                    disabled={isLoading}
                    suppressHydrationWarning
                />
                <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
