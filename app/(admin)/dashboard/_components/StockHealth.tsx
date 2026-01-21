"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface StockProduct {
  id: string;
  name: string;
  image?: string;
  stock: number;
  minStock?: number;
  isOutOfStock: boolean;
}

interface StockHealthProps {
  lowStockProducts: StockProduct[];
  outOfStockProducts: StockProduct[];
}

export default function StockHealth({ lowStockProducts, outOfStockProducts }: StockHealthProps) {
  const router = useRouter();

  const criticalProducts = [...outOfStockProducts, ...lowStockProducts].slice(0, 5);

  if (criticalProducts.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">Stok Durumu</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Tüm ürünler stokta ✨</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Stok Uyarıları</CardTitle>
          </div>
          <button
            onClick={() => router.push("/admin-products")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            Tümünü gör
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {criticalProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group hover:bg-gray-50/50 transition-colors"
            >
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold ${
                      product.isOutOfStock ? "text-red-600" : "text-amber-600"
                    }`}>
                      {product.isOutOfStock ? "Tükendi" : `${product.stock} adet`}
                    </span>
                    {product.minStock && product.stock > 0 && (
                      <span className="text-xs text-gray-500">
                        (Min: {product.minStock})
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin-products/${product.id}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  Güncelle
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
