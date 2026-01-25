"use client";

import { ShieldCheck, CreditCard, Truck, RotateCcw, Lock, Award } from "lucide-react";

interface TrustBadge {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const badges: TrustBadge[] = [
    {
        icon: <Lock className="w-6 h-6" />,
        title: "256-bit SSL",
        description: "Güvenli bağlantı",
    },
    {
        icon: <CreditCard className="w-6 h-6" />,
        title: "3D Secure",
        description: "Güvenli ödeme",
    },
    {
        icon: <Truck className="w-6 h-6" />,
        title: "Hızlı Teslimat",
        description: "1-3 iş günü",
    },
    {
        icon: <RotateCcw className="w-6 h-6" />,
        title: "Kolay İade",
        description: "14 gün içinde",
    },
    {
        icon: <ShieldCheck className="w-6 h-6" />,
        title: "Orijinal Ürün",
        description: "%100 Garanti",
    },
    {
        icon: <Award className="w-6 h-6" />,
        title: "Kalite Güvencesi",
        description: "Premium kalite",
    },
];

interface TrustBadgesProps {
    variant?: "default" | "compact" | "horizontal";
    className?: string;
}

export default function TrustBadges({ variant = "default", className = "" }: TrustBadgesProps) {
    if (variant === "compact") {
        return (
            <div className={`flex items-center justify-center gap-4 ${className}`}>
                {badges.slice(0, 4).map((badge, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-600">
                        <div className="text-green-600">{badge.icon}</div>
                        <span className="text-sm font-medium">{badge.title}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "horizontal") {
        return (
            <div className={`flex flex-wrap items-center justify-center gap-6 py-4 ${className}`}>
                {badges.map((badge, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg"
                    >
                        <div className="text-emerald-600">{badge.icon}</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
                            <p className="text-xs text-gray-500">{badge.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
            {badges.map((badge, index) => (
                <div
                    key={index}
                    className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full mb-3">
                        {badge.icon}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                </div>
            ))}
        </div>
    );
}
