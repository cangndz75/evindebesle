"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Bell,
    Check,
    CheckCheck,
    Package,
    ShoppingCart,
    AlertTriangle,
    Info,
    DollarSign,
    MessageSquare,
    RefreshCw,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export function AdminNotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const { data, mutate } = useSWR<{ notifications: AdminNotification[]; unreadCount: number }>(
        "/api/admin/notifications?limit=20",
        fetcher,
        {
            refreshInterval: 30000,
            revalidateOnFocus: true,
        }
    );

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const handleMarkAsRead = async (id: string, link?: string) => {
        try {
            await fetch("/api/admin/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            mutate();

            if (link) {
                router.push(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch("/api/admin/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
            mutate();
            toast.success("Tüm bildirimler okundu olarak işaretlendi");
        } catch (error) {
            toast.error("Bir hata oluştu");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "ORDER":
                return <ShoppingCart className="h-4 w-4 text-blue-500" />;
            case "STOCK":
                return <Package className="h-4 w-4 text-orange-500" />;
            case "RETURN":
                return <RefreshCw className="h-4 w-4 text-red-500" />;
            case "PAYMENT":
                return <DollarSign className="h-4 w-4 text-green-500" />;
            case "SUPPORT":
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group hover:bg-gray-800 transition-colors">
                    <Bell className={cn("h-5 w-5 text-gray-400 group-hover:text-white transition-colors",
                        unreadCount > 0 && "animate-pulse-subtle"
                    )} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 shadow-xl border-gray-200">
                <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Bildirimler</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                handleMarkAllRead();
                            }}
                            className="h-auto px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </DropdownMenuLabel>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">Henüz bildirim yok.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 mb-1 cursor-pointer rounded-md border-b border-gray-50 last:border-0",
                                        !notification.isRead ? "bg-blue-50/50 hover:bg-blue-100/50" : "opacity-80 hover:bg-gray-50"
                                    )}
                                    onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                >
                                    <div className={cn("mt-1 p-2 rounded-full bg-white border shadow-sm",
                                        !notification.isRead && "border-blue-200"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.isRead && "text-blue-700")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: tr,
                                            })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DropdownMenuSeparator />
                {/* Optional: Add "View All" link if a dedicated page exists */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
