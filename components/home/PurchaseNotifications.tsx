"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import Image from "next/image";

interface PurchaseNotification {
    id: string;
    productName: string;
    productImage: string;
    buyerName: string;
    city: string;
    timeAgo: string;
}

export default function PurchaseNotifications() {
    const [notifications, setNotifications] = useState<PurchaseNotification[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchRecentPurchases = async () => {
            try {
                const res = await fetch("/api/products/recent-purchases");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.purchases || []);
                }
            } catch (error) {
                console.error("Failed to fetch purchases:", error);
            }
        };

        fetchRecentPurchases();
    }, []);

    useEffect(() => {
        if (notifications.length === 0 || dismissed) return;

        const showTimeout = setTimeout(() => {
            setVisible(true);
        }, 5000);

        const interval = setInterval(() => {
            if (dismissed) return;

            setVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % notifications.length);
                setVisible(true);
            }, 500);
        }, 15000);

        const hideTimeout = setTimeout(() => {
            setVisible(false);
        }, 10000);

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
            clearInterval(interval);
        };
    }, [notifications, currentIndex, dismissed]);

    if (notifications.length === 0 || dismissed || !visible) return null;

    const current = notifications[currentIndex];
    if (!current) return null;

    return (
        <div className="fixed bottom-4 left-4 z-40 animate-slide-in">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {current.productImage ? (
                        <Image
                            src={current.productImage}
                            alt={current.productName}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">
                        {current.buyerName}, {current.city}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{current.productName} satın aldı</p>
                    <p className="text-xs text-gray-400 mt-1">{current.timeAgo}</p>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
