"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ShoppingCart, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ActionItem {
  type: "order" | "stock" | "appointment";
  message: string;
  count: number;
  href: string;
  priority: "high" | "medium" | "low";
}

interface SmartActionBarProps {
  actions: ActionItem[];
}

export default function SmartActionBar({ actions }: SmartActionBarProps) {
  const router = useRouter();

  if (actions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-gray-100/50 to-gray-50 border border-gray-200/50 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="relative px-6 py-4">
          <p className="text-sm font-light text-gray-600">Her şey yolunda görünüyor ✨</p>
        </div>
      </motion.div>
    );
  }

  const getIcon = (type: ActionItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4" />;
      case "stock":
        return <Package className="w-4 h-4" />;
      case "appointment":
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getGradient = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "high":
        return "from-red-50/80 via-orange-50/60 to-amber-50/80";
      case "medium":
        return "from-amber-50/80 via-yellow-50/60 to-yellow-50/80";
      case "low":
        return "from-blue-50/80 via-indigo-50/60 to-purple-50/80";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {actions.map((action, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push(action.href)}
          className={`w-full relative overflow-hidden rounded-xl bg-gradient-to-r ${getGradient(action.priority)} border border-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg group`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
          <div className="relative px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                action.priority === "high" ? "bg-red-100/80" :
                action.priority === "medium" ? "bg-amber-100/80" :
                "bg-blue-100/80"
              }`}>
                {getIcon(action.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  <span className="font-semibold">{action.count}</span> {action.message}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
