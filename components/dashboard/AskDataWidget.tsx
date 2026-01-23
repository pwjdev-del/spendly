"use client"

import { useState, useRef, useEffect } from "react"
import { askData, createExpenseFromSia, createTaskFromSia, cancelSubscriptionFromSia } from "@/app/actions/ai-analytics"
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

export function AskSiaWidget() {
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
                const processedAnswer = await handleAction(result.answer || "")
                setMessages(prev => [...prev, { role: 'assistant', content: processedAnswer }])
            }
        } catch (error) {
            toast.error("Failed to connect to AI")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = async (response: string) => {
        // Check for Action Tags
        if (response.startsWith('[ACTION:')) {
            const actionEnd = response.indexOf(']')
            const actionType = response.substring(8, actionEnd)
            const jsonStr = response.substring(actionEnd + 1)

            try {
                const params = JSON.parse(jsonStr)
                let result;

                if (actionType === 'CREATE_EXPENSE') {
                    result = await createExpenseFromSia(params)
                } else if (actionType === 'CREATE_TASK') {
                    result = await createTaskFromSia(params)
                } else if (actionType === 'CANCEL_SUBSCRIPTION') {
                    result = await cancelSubscriptionFromSia(params)
                }

                if (result?.error) {
                    return `Error executing action: ${result.error}`
                } else if (result?.success) {
                    if (actionType === 'CREATE_EXPENSE') return `Created expense for ${params.merchant} ($${params.amount})`
                    if (actionType === 'CREATE_TASK') return `Added task: ${params.title}`
                    if (actionType === 'CANCEL_SUBSCRIPTION') return (result as any).message || `Cancelled subscription: ${params.subscriptionName}`
                    return "Action executed successfully."
                }
            } catch (e) {
                console.error("Action Parse Error", e)
                return "I tried to perform an action but failed to parse the parameters."
            }
        }
        return response
    }

    return (
        <div className="flex flex-col h-full bg-[#0B1020] rounded-xl border border-[#E9ECF7]/20 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E9ECF7]/20 bg-[#141C3A]/50 flex items-center gap-2">
                <div className="h-4 w-4 relative overflow-hidden">
                    <Image src="/sia-mascot-new.png" alt="Sia" fill className="object-cover scale-125" />
                </div>
                <h3 className="font-semibold text-sm text-[#E9ECF7]">Ask Sia</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-3" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="text-center text-[#E9ECF7]/70 text-sm py-8 space-y-2">
                            <div className="h-8 w-8 mx-auto relative opacity-50 overflow-hidden">
                                <Image src="/sia-mascot-new.png" alt="Sia" fill className="object-cover scale-125" />
                            </div>
                            <p>I am your Senior Financial Assistant.</p>
                            <p className="text-xs">"Add expense $50 for dinner"</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="h-6 w-6 rounded-full bg-[#E9ECF7]/10 flex items-center justify-center shrink-0 mt-1 overflow-hidden relative">
                                    <Image src="/sia-mascot-new.png" alt="Sia" fill className="object-cover scale-150" />
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
                            <span className="animate-pulse">Sia is thinking...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleAsk} className="p-3 border-t border-[#E9ECF7]/20 bg-[#141C3A]/30 flex gap-2" suppressHydrationWarning>
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask Sia or add expense..."
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
