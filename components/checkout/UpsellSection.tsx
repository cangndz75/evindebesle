"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cartStore";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    image: string | null;
    slug: string;
}

export default function UpsellSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const { addItemOptimistic } = useCartStore();
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchUpsells = async () => {
            try {
                const res = await fetch("/api/products/upsell?tag=kasa_onu");
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Failed to fetch upsell products", error);
            }
        };

        fetchUpsells();
    }, []);

    const handleAddToCart = async (product: Product) => {
        setLoading(product.id);
        try {

            await addItemOptimistic({
                productId: product.id,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image || "",
                },
                quantity: 1,
                colorId: null,
                sizeId: null,
            });
            window.dispatchEvent(
                new CustomEvent("itemAddedToCart", {
                    detail: {
                        product: {
                            id: product.id,
                            name: product.name,
                            image: product.image || "",
                            price: product.price || 0,
                        },
                        size: "",
                        color: "",
                    },
                })
            );
        } catch (error) {
            toast.error("Ürün eklenirken hata oluştu");
        } finally {
            setLoading(null);
        }
    };

    if (products.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Kasa Önü Fırsatlar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 flex flex-col items-center text-center bg-white shadow-sm">
                        <div className="relative w-24 h-24 mb-2">
                            <Image
                                src={product.image || "/placeholder.png"}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h4 className="text-sm font-medium line-clamp-2 min-h-[40px]">{product.name}</h4>
                        <p className="text-sm font-bold text-gray-900 mt-1">{product.price} ₺</p>
                        <button
                            onClick={() => handleAddToCart(product)}
                            disabled={loading === product.id}
                            className="mt-2 w-full bg-black text-white text-xs py-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {loading === product.id ? "Ekleniyor..." : "Sepete Ekle"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
