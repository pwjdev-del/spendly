"use client"

import { useState, useRef, useEffect } from "react"
import { askData } from "@/app/actions/ai-analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles, User, Bot } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

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
        <div className="flex flex-col h-full bg-[#0B1020] rounded-xl border border-[#E9ECF7]/20 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E9ECF7]/20 bg-[#141C3A]/50 flex items-center gap-2">
                <div className="h-4 w-4 relative overflow-hidden">
                    <Image src="/sia-mascot.png" alt="Sia" fill className="object-cover scale-125" />
                </div>
                <h3 className="font-semibold text-sm text-[#E9ECF7]">Ask Sia</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-3" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="text-center text-[#E9ECF7]/70 text-sm py-8 space-y-2">
                            <div className="h-8 w-8 mx-auto relative opacity-50 overflow-hidden">
                                <Image src="/sia-mascot.png" alt="Sia" fill className="object-cover scale-125" />
                            </div>
                            <p>Ask me about your spending!</p>
                            <p className="text-xs">"How much spent on Food?"</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="h-6 w-6 rounded-full bg-[#E9ECF7]/10 flex items-center justify-center shrink-0 mt-1 overflow-hidden relative">
                                    <Image src="/sia-mascot.png" alt="Sia" fill className="object-cover p-0.5 scale-125" />
                                </div>
                            )}
                            <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${m.role === 'user'
                                ? 'bg-[#E9ECF7] text-[#0B1020]'
                                : 'bg-[#1F2A5A] text-[#E9ECF7]'
                                }`}>
                                {m.content}
                            </div>
                            {m.role === 'user' && (
                                <div className="h-6 w-6 rounded-full bg-[#1F2A5A] flex items-center justify-center shrink-0 mt-1">
                                    <User className="h-3 w-3 text-[#E9ECF7]" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-[#E9ECF7]/60 text-xs ml-8">
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleAsk} className="p-3 border-t border-[#E9ECF7]/20 bg-[#141C3A]/30 flex gap-2" suppressHydrationWarning>
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-[#1F2A5A] border-[#E9ECF7]/20 text-[#E9ECF7] placeholder:text-[#E9ECF7]/50"
                    disabled={isLoading}
                    suppressHydrationWarning
                />
                <Button type="submit" size="icon" disabled={isLoading || !query.trim()} className="bg-[#E9ECF7] text-[#0B1020] hover:bg-[#E9ECF7]/90">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
