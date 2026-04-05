"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, ExternalLink, ShoppingCart, Package, Ticket, Settings } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  itemCount: number;
}

interface OrderOperationsProps {
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

const statusConfig = {
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  PREPARING: { label: "Hazırlanıyor", color: "bg-blue-100 text-blue-800 border-blue-200" },
  SHIPPED: { label: "Kargoda", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "İptal", color: "bg-red-100 text-red-800 border-red-200" },
  REFUNDED: { label: "İade", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export default function OrderOperations({ orders, onStatusChange }: OrderOperationsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PENDING" | "PREPARING" | "SHIPPED" | "REFUNDED">("PENDING");

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "PENDING") return order.status === "PENDING";
    if (activeTab === "PREPARING") return order.status === "PREPARING";
    if (activeTab === "SHIPPED") return order.status === "SHIPPED";
    if (activeTab === "REFUNDED") return order.status === "REFUNDED" || order.status === "CANCELLED";
    return false;
  });

  const tabs = [
    { key: "PENDING" as const, label: "Bekliyor", count: orders.filter((o) => o.status === "PENDING").length },
    { key: "PREPARING" as const, label: "Hazırlanıyor", count: orders.filter((o) => o.status === "PREPARING").length },
    { key: "SHIPPED" as const, label: "Kargoda", count: orders.filter((o) => o.status === "SHIPPED").length },
    { key: "REFUNDED" as const, label: "İade/İptal", count: orders.filter((o) => o.status === "REFUNDED" || o.status === "CANCELLED").length },
  ];

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">Sipariş Operasyonları</CardTitle>
          <button
            onClick={() => router.push("/admin-orders")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            Tümünü gör
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        
        <div className="flex gap-2 mt-4 p-1 bg-gray-100 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredOrders.length === 0 ? (
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">İlk Satışa Hazırlık</h3>
              <p className="text-sm text-gray-500 mb-6">
                {activeTab === "PENDING" 
                  ? "Henüz bekleyen sipariş yok. İlk siparişinizi almak için aşağıdaki adımları tamamlayın."
                  : "Bu kategoride sipariş bulunmuyor."}
              </p>
            </div>
            
            {activeTab === "PENDING" && (
              <div className="space-y-3 max-w-md mx-auto">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => router.push("/admin-products")}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Ürün Ekle</p>
                    <p className="text-xs text-gray-500">Kataloğunuza ürün ekleyin</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => router.push("/coupons")}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Ticket className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">İlk Kuponunu Oluştur</p>
                    <p className="text-xs text-gray-500">Müşterilerinize özel indirimler sunun</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => router.push("/company-settings")}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Settings className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Kargo/Ödeme Ayarlarını Tamamla</p>
                    <p className="text-xs text-gray-500">Siparişlerin sorunsuz işlemesi için</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-gray-50/50 transition-colors"
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })}
                        </p>
                      </div>
                      <Badge className={`${statusConfig[order.status].color} border font-medium text-xs`}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{order.customerName}</span>
                      <span>•</span>
                      <span>{order.itemCount} ürün</span>
                      <span>•</span>
                      <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin-orders/${order.id}`)}>
                        Detayları Gör
                      </DropdownMenuItem>
                      {order.status === "PENDING" && (
                        <DropdownMenuItem onClick={() => onStatusChange?.(order.id, "PREPARING")}>
                          Hazırlanıyor Yap
                        </DropdownMenuItem>
                      )}
                      {order.status === "PREPARING" && (
                        <DropdownMenuItem onClick={() => onStatusChange?.(order.id, "SHIPPED")}>
                          Kargoya Ver
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
