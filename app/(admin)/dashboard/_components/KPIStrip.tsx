"use client";

import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    CreditCard,
    Activity,
    PackageX,
    Truck,
    RotateCcw,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPIItem {
    title: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    description?: string;
    actionText?: string;
    actionUrl?: string;
    tooltip?: string;
    icon: React.ReactNode;
    color: "blue" | "green" | "red" | "orange" | "purple" | "indigo";
}

interface KPIStripProps {
    data: {
        revenue: { value: string; change: string; isPositive: boolean };
        orders: { value: string; change: string; isPositive: boolean };
        aov: { value: string; change: string; isPositive: boolean };
        conversion: { value: string; tooltip: string };
        abandonedCart: { value: number; actionUrl: string };
        returnRate: { value: string; isHigh: boolean };
        cargoDelay: { value: number; actionUrl: string };
        criticalStock: { value: number; actionUrl: string };
    };
}

export default function KPIStrip({ data }: KPIStripProps) {
    const router = useRouter();

    const items: KPIItem[] = [
        {
            title: "Bugünkü Ciro",
            value: data.revenue.value,
            change: data.revenue.change,
            changeType: data.revenue.isPositive ? "positive" : "negative",
            actionText: "Detaya git",
            actionUrl: "/admin-orders",
            icon: <CreditCard className="w-4 h-4" />,
            color: "green",
        },
        {
            title: "Sipariş Sayısı",
            value: data.orders.value,
            change: data.orders.change,
            changeType: data.orders.isPositive ? "positive" : "negative",
            icon: <ShoppingCart className="w-4 h-4" />,
            color: "blue",
        },
        {
            title: "Ortalama Sepet (AOV)",
            value: data.aov.value,
            description: "Son 24 saat",
            icon: <Activity className="w-4 h-4" />,
            color: "indigo",
        },
        {
            title: "Dönüşüm Oranı",
            value: data.conversion.value,
            tooltip: data.conversion.tooltip,
            icon: <TrendingUp className="w-4 h-4" />,
            color: "purple",
        },
        {
            title: "Terk Edilen Sepet",
            value: data.abandonedCart.value.toString(),
            actionText: "Otomasyon başlat",
            actionUrl: "/admin-marketing/automations",
            icon: <ShoppingCart className="w-4 h-4 opacity-50" />,
            color: "orange",
        },
        {
            title: "İade Oranı",
            value: data.returnRate.value,
            changeType: data.returnRate.isHigh ? "negative" : "positive",
            icon: <RotateCcw className="w-4 h-4" />,
            color: "red",
        },
        {
            title: "Kargo Gecikme",
            value: `${data.cargoDelay.value} paket`,
            actionText: data.cargoDelay.value > 0 ? "Kargo sorunları" : undefined,
            actionUrl: "/admin-cargo/delays",
            icon: <Truck className="w-4 h-4" />,
            color: data.cargoDelay.value > 0 ? "red" : "green",
        },
        {
            title: "Stokta Kritik",
            value: `${data.criticalStock.value} SKU`,
            actionText: data.criticalStock.value > 0 ? "Stok planla" : undefined,
            actionUrl: "/admin-stock",
            icon: <PackageX className="w-4 h-4" />,
            color: data.criticalStock.value > 0 ? "orange" : "green",
        },
    ];

    return (
        <div className="w-full overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`
              relative w-[200px] p-4 rounded-xl border border-gray-100 bg-white
              hover:shadow-lg hover:border-gray-200 transition-all duration-200
              flex flex-col justify-between group
            `}
                        role="button"
                        onClick={() => item.actionUrl && router.push(item.actionUrl)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500">{item.title}</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={`
                        p-1.5 rounded-lg 
                        ${item.color === 'green' ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${item.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                        ${item.color === 'red' ? 'bg-red-50 text-red-600' : ''}
                        ${item.color === 'orange' ? 'bg-orange-50 text-orange-600' : ''}
                        ${item.color === 'purple' ? 'bg-purple-50 text-purple-600' : ''}
                        ${item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : ''}
                      `}>
                                            {item.icon}
                                        </div>
                                    </TooltipTrigger>
                                    {item.tooltip && <TooltipContent>{item.tooltip}</TooltipContent>}
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">
                                {item.value}
                            </div>

                            {(item.change || item.description) && (
                                <div className="flex items-center gap-1.5">
                                    {item.change && (
                                        <span className={`
                      text-xs font-semibold px-1.5 py-0.5 rounded-md
                      ${item.changeType === 'positive' ? 'bg-green-50 text-green-700' : ''}
                      ${item.changeType === 'negative' ? 'bg-red-50 text-red-700' : ''}
                      ${item.changeType === 'neutral' ? 'bg-gray-50 text-gray-700' : ''}
                    `}>
                                            {item.change}
                                        </span>
                                    )}
                                    {item.description && (
                                        <span className="text-xs text-gray-400">{item.description}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {item.actionText && (
                            <div className="mt-3 pt-3 border-t border-gray-50">
                                <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                                    {item.actionText}
                                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
