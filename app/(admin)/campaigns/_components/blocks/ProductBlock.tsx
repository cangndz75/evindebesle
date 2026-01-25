"use client";

import { Block } from "../../types";

interface ProductBlockProps {
    block: Block;
}

interface ProductItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    slug?: string;
}

export default function ProductBlock({ block }: ProductBlockProps) {
    const products: ProductItem[] = block.content.products || [];
    const columns = block.content.columns || 3;
    const backgroundColor = block.style.backgroundColor || "#ffffff";
    const buttonText = block.content.buttonText || "Sepete Ekle";
    const buttonColor = block.style.buttonColor || "#000000";
    const showPrices = block.content.showPrices !== false;
    const showButton = block.content.showButton !== false;

    const getGridClass = () => {
        switch (columns) {
            case 2:
                return "grid-cols-2";
            case 4:
                return "grid-cols-4";
            case 3:
            default:
                return "grid-cols-3";
        }
    };

    if (products.length === 0) {
        return (
            <div className="p-8 text-center" style={{ backgroundColor }}>
                <div className="border-2 border-dashed border-gray-300 rounded-lg py-12 px-4">
                    <p className="text-gray-400 text-sm">
                        Ürün seçmek için sağ panelden ürün ekleyin
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4" style={{ backgroundColor }}>
            <div className={`grid ${getGridClass()} gap-4`}>
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-lg overflow-hidden shadow-sm border"
                    >
                        {product.image && (
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="p-3">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                                {product.name}
                            </h3>
                            {showPrices && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-gray-900">
                                        {product.price.toLocaleString("tr-TR")} TL
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-xs text-gray-500 line-through">
                                            {product.originalPrice.toLocaleString("tr-TR")} TL
                                        </span>
                                    )}
                                </div>
                            )}
                            {showButton && (
                                <button
                                    className="w-full py-2 px-3 text-xs font-medium text-white rounded transition-colors"
                                    style={{ backgroundColor: buttonColor }}
                                >
                                    {buttonText}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
