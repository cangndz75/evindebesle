"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface LiveViewersBadgeProps {
    productId: string;
    className?: string;
}

export default function LiveViewersBadge({ productId, className = "" }: LiveViewersBadgeProps) {
    const [viewers, setViewers] = useState<number>(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const registerView = async () => {
            try {
                await fetch("/api/products/live-viewers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId }),
                });
            } catch (error) {
                console.error("View registration failed:", error);
            }
        };

        registerView();

        const fetchViewers = async () => {
            try {
                const res = await fetch(`/api/products/live-viewers?productId=${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setViewers(data.count || 0);
                    setShow(data.count > 1); // 1'den fazla kişi varsa göster
                }
            } catch (error) {
                console.error("Failed to fetch viewers:", error);
            }
        };

        fetchViewers();

        const interval = setInterval(fetchViewers, 30000);

        return () => clearInterval(interval);
    }, [productId]);

    if (!show) return null;

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-orange-700 ${className}`}
        >
            <div className="relative">
                <Eye className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium">
                {viewers} kişi şu an bakıyor
            </span>
        </div>
    );
}
