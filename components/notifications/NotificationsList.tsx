"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    MessageCircle,
    AtSign,
    FileText,
    Calendar,
    Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "@/app/actions/notifications"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
    id: string
    type: string
    title: string
    body?: string | null
    readAt: Date | null
    createdAt: Date
    entityType: string
    entityId: string
}

interface NotificationsListProps {
    initialNotifications: Notification[]
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
    const [filter, setFilter] = useState<"all" | "unread">("all")
    const router = useRouter()

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, readAt: new Date() } : n
        ))

        await markAsRead(id)
        router.refresh()
    }

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })))

        await markAllAsRead()
        router.refresh()
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id))

        await deleteNotification(id)
        router.refresh()
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.readAt
        return true
    })

    const getIcon = (type: string) => {
        switch (type) {
            case "MENTION": return <AtSign className="h-4 w-4 text-blue-500" />
            case "COMMENT": return <MessageCircle className="h-4 w-4 text-green-500" />
            case "APPROVAL_REQUEST": return <FileText className="h-4 w-4 text-orange-500" />
            case "TODO": return <Calendar className="h-4 w-4 text-purple-500" />
            default: return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    const getLink = (notification: Notification) => {
        switch (notification.entityType) {
            case "EXPENSE": return `/expenses/${notification.entityId}`
            case "TRIP": return `/trips/${notification.entityId}`
            case "REPORT": return `/reports/${notification.entityId}` // Assuming reports exist? Or trip reports?
            case "TODO": return `/todo`
            default: return "#"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={!notifications.some(n => !n.readAt)}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all read
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-foreground">No notifications</h3>
                        <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={cn(
                                "group relative flex items-start gap-4 p-4 rounded-lg border transition-all hover:bg-muted/50",
                                !notification.readAt ? "bg-card border-l-4 border-l-primary shadow-sm" : "bg-muted/10 opacity-70 hover:opacity-100"
                            )}
                        >
                            <div className="mt-1 bg-background p-2 rounded-full border shadow-sm">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <Link href={getLink(notification)} onClick={() => !notification.readAt && handleMarkAsRead(notification.id)}>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className={cn("text-sm font-semibold", !notification.readAt ? "text-foreground" : "text-muted-foreground")}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {notification.body}
                                    </p>
                                </Link>

                                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.readAt && (
                                        <Button variant="ghost" size="xs" className="h-6 text-xs" onClick={() => handleMarkAsRead(notification.id)}>
                                            <Check className="mr-1 h-3 w-3" /> Mark read
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDelete(notification.id, e)}
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                                    </Button>
                                </div>
                            </div>

                            {!notification.readAt && (
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
