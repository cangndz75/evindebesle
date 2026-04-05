"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";

interface HoverImageSliderProps {
    images: string[];
    alt: string;
    sizes?: string;
    priority?: boolean;
    className?: string;
    aspectRatio?: "square" | "portrait"; // portrait = 3/4
    badge?: React.ReactNode;
    favoriteButton?: React.ReactNode;
    onImageChange?: (index: number) => void;
    isOutOfStock?: boolean;
}

export default function HoverImageSlider({
    images,
    alt,
    sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
    priority = false,
    className = "",
    aspectRatio = "portrait",
    badge,
    favoriteButton,
    onImageChange,
    isOutOfStock = false,
}: HoverImageSliderProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const validImages = useMemo(() => {
        const filtered = images.filter((img) => img && img.trim() !== "");
        return filtered.length > 0
            ? filtered
            : ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop"];
    }, [images]);

    const imageCount = validImages.length;

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (imageCount <= 1) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const newIndex = Math.min(
                Math.floor(percentage * imageCount),
                imageCount - 1
            );

            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
                onImageChange?.(newIndex);
            }
        },
        [imageCount, activeIndex, onImageChange]
    );

    const handleMouseLeave = useCallback(() => {
        setActiveIndex(0);
        onImageChange?.(0);
    }, [onImageChange]);

    const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-3/4";

    return (
        <div
            className={`relative ${aspectClass} overflow-hidden bg-gray-100 ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            
            {validImages.map((img, idx) => (
                <Image
                    key={idx}
                    src={img}
                    alt={idx === 0 ? alt : `${alt} - ${idx + 1}`}
                    fill
                    className={`object-cover transition-opacity duration-200 ${
                        idx === activeIndex
                            ? isOutOfStock
                                ? "opacity-40 grayscale-[20%]"
                                : "opacity-100"
                            : "opacity-0"
                    }`}
                    sizes={sizes}
                    loading={priority && idx === 0 ? "eager" : "lazy"}
                    quality={85}
                    priority={priority && idx === 0}
                />
            ))}

            
            {badge}

            
            {favoriteButton}

            
            {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-white/90 text-black px-4 py-2 text-xs font-bold tracking-widest uppercase">
                        STOKTA YOK
                    </div>
                </div>
            )}

            
            {imageCount > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {validImages.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                                    ? "bg-black scale-110"
                                    : "bg-black/20"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
