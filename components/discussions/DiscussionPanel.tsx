"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getOrCreateDiscussion,
    createMessage,
    deleteMessage,
    searchUsersForMention,
} from "@/app/actions/discussions";
import { formatDistanceToNow } from "date-fns";

interface DiscussionPanelProps {
    entityType: "EXPENSE" | "TRIP" | "REPORT";
    entityId: string;
    currentUserId?: string; // Optional because we might handle auth differently later, but good to have
    title?: string;
    className?: string;
    scrollAreaClassName?: string;
}

interface Message {
    id: string;
    body: string;
    createdAt: Date;
    editedAt: Date | null;
    author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    mentions: Array<{
        mentionedUser: {
            id: string;
            name: string | null;
            email: string | null;
        };
    }>;
    replies: Message[];
}

interface Discussion {
    id: string;
    messages: Message[];
}

export function DiscussionPanel({
    entityType,
    entityId,
    currentUserId,
    title = "Discussion",
    className,
    scrollAreaClassName
}: DiscussionPanelProps) {
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load discussion on mount
    useEffect(() => {
        async function loadDiscussion() {
            try {
                const disc = await getOrCreateDiscussion(entityType, entityId);
                setDiscussion(disc as unknown as Discussion);
            } catch (error) {
                console.error("Failed to load discussion:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDiscussion();
    }, [entityType, entityId]);

    // Handle @mention detection
    const handleMessageChange = async (value: string) => {
        setNewMessage(value);

        // Check for @mention pattern
        const mentionMatch = value.match(/@(\w*)$/);
        if (mentionMatch) {
            const query = mentionMatch[1];
            if (query.length >= 1) {
                const users = await searchUsersForMention(query);
                setMentionSuggestions(users);
                setShowMentions(true);
            }
        } else {
            setShowMentions(false);
            setMentionSuggestions([]);
        }
    };

    // Insert mention
    const insertMention = (user: { name: string | null; email: string }) => {
        const displayName = user.name || user.email;
        const newValue = newMessage.replace(/@\w*$/, `@${displayName} `);
        setNewMessage(newValue);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || !discussion) return;

        setIsSending(true);
        try {
            const message = await createMessage({
                discussionId: discussion.id,
                body: newMessage.trim(),
                parentId: replyingTo || undefined,
            });

            // Refresh discussion
            const disc = await getOrCreateDiscussion(entityType, entityId);
            setDiscussion(disc as unknown as Discussion);
            setNewMessage("");
            setReplyingTo(null);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    // Delete message
    const handleDelete = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            // Refresh discussion
            const disc = await getOrCreateDiscussion(entityType, entityId);
            setDiscussion(disc as unknown as Discussion);
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };

    // Render highlighted message with @mentions
    const renderMessageBody = (body: string) => {
        const parts = body.split(/(@\w+(?:\.\w+)?@[\w.-]+\.\w+|@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return (
                    <span key={i} className="text-primary font-medium">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    // Render single message
    const renderMessage = (message: Message, isReply = false) => (
        <div
            key={message.id}
            className={`group flex gap-3 ${isReply ? "ml-10 mt-2" : ""}`}
        >
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={message.author.image || undefined} />
                <AvatarFallback>
                    {message.author.name?.charAt(0) || message.author.email?.charAt(0) || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                        {message.author.name || message.author.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    {message.editedAt && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                </div>
                <p className="text-sm mt-0.5 break-words">
                    {renderMessageBody(message.body)}
                </p>
                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isReply && (
                        <button
                            onClick={() => setReplyingTo(message.id)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <Reply className="h-3 w-3" />
                            Reply
                        </button>
                    )}
                    {message.author.id === currentUserId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() => handleDelete(message.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading discussion...
            </div>
        );
    }

    return (
        <div className={`border rounded-lg bg-card ${className || ""}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">{title}</h3>
                <span className="text-xs text-muted-foreground">
                    ({discussion?.messages.length || 0} messages)
                </span>
            </div>

            {/* Messages */}
            <div className={`p-4 space-y-4 overflow-y-auto ${scrollAreaClassName || "max-h-[400px]"}`}>
                {discussion?.messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    discussion?.messages.map((message) => (
                        <div key={message.id}>
                            {renderMessage(message)}
                            {message.replies?.map((reply) => renderMessage(reply, true))}
                        </div>
                    ))
                )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
                <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Replying to message...</span>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="text-xs hover:underline"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Compose */}
            <div className="p-4 border-t relative">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => handleMessageChange(e.target.value)}
                            placeholder="Write a comment... Use @name to mention"
                            className="min-h-[60px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        {/* Mention suggestions */}
                        {showMentions && mentionSuggestions.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-1 bg-popover border rounded-md shadow-lg z-10 w-64">
                                {mentionSuggestions.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm"
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={user.image} />
                                            <AvatarFallback>
                                                {user.name?.charAt(0) || user.email?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name || user.email}</div>
                                            {user.name && (
                                                <div className="text-xs text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        size="sm"
                        className="self-end"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
