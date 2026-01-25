"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ShoppingCart, Package, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ActionInboxItem {
  type: string;
  count: number;
  label: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface ActionInboxProps {
  items: ActionInboxItem[];
}

const getIcon = (type: string) => {
  if (type.includes("order") || type.includes("ship") || type.includes("refund")) {
    return <ShoppingCart className="w-4 h-4" />;
  }
  if (type.includes("stock") || type.includes("product")) {
    return <Package className="w-4 h-4" />;
  }
  if (type.includes("payment") || type.includes("fraud")) {
    return <CreditCard className="w-4 h-4" />;
  }
  if (type.includes("appointment")) {
    return <Calendar className="w-4 h-4" />;
  }
  return <AlertTriangle className="w-4 h-4" />;
};

const getPriorityColor = (priority: "high" | "medium" | "low") => {
  switch (priority) {
    case "high":
      return "bg-red-50 border-red-200 hover:bg-red-100";
    case "medium":
      return "bg-amber-50 border-amber-200 hover:bg-amber-100";
    case "low":
      return "bg-blue-50 border-blue-200 hover:bg-blue-100";
  }
};

const getPriorityIconColor = (priority: "high" | "medium" | "low") => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-600";
    case "medium":
      return "bg-amber-100 text-amber-600";
    case "low":
      return "bg-blue-100 text-blue-600";
  }
};

export default function ActionInbox({ items }: ActionInboxProps) {
  const router = useRouter();

  // Önceliğe göre sırala: high -> medium -> low
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Maksimum 10 öğe göster
  const displayItems = sortedItems.slice(0, 10);

  if (displayItems.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Action Inbox</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Bekleyen iş yok ✨</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Operasyon Akışı (Bugün)</CardTitle>
          </div>
          {displayItems.length > 0 && (
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {displayItems.length}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {displayItems.map((item, index) => (
            <motion.button
              key={`${item.type}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(item.action)}
              className={`w-full text-left px-6 py-4 transition-all group ${getPriorityColor(item.priority)} border-l-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getPriorityIconColor(item.priority)}`}>
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.priority === "high" && "Acil"}
                    {item.priority === "medium" && "Önemli"}
                    {item.priority === "low" && "Bilgilendirme"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
