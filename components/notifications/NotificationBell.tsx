"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    entityType: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: Date;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load notifications on mount
    useEffect(() => {
        async function loadNotifications() {
            try {
                const [notifs, count] = await Promise.all([
                    getNotifications({ limit: 10 }),
                    getUnreadCount(),
                ]);
                setNotifications(notifs as Notification[]);
                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to load notifications:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadNotifications();
    }, []);

    // Refresh when popover opens
    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open) {
            const notifs = await getNotifications({ limit: 10 });
            setNotifications(notifs as Notification[]);
        }
    };

    // Mark single notification as read
    const handleMarkRead = async (id: string) => {
        await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    // Get link for notification
    const getNotificationLink = (notif: Notification): string => {
        if (notif.entityType === "EXPENSE" && notif.entityId) {
            return `/expenses/${notif.entityId}`;
        }
        if (notif.entityType === "TRIP" && notif.entityId) {
            return `/trips/${notif.entityId}`;
        }
        return "#";
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <Link
                                key={notif.id}
                                href={getNotificationLink(notif)}
                                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                                className={`block px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!notif.isRead ? "bg-primary/5" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {!notif.isRead && (
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                    )}
                                    <div className={!notif.isRead ? "" : "ml-5"}>
                                        <p className="text-sm font-medium">{notif.title}</p>
                                        {notif.body && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {notif.body}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="border-t p-2">
                        <Link
                            href="/notifications"
                            className="block text-center text-xs text-primary hover:underline py-1"
                        >
                            View all notifications
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
