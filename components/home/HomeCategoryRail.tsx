"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Category = {
    id: string;
    name: string;
    slug: string;
    image: string | null;
};

type HomeCategoryRailProps = {
    categories: Category[];
};

export default function HomeCategoryRail({ categories }: HomeCategoryRailProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const amount = 300;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    if (!categories || categories.length === 0) return null;

    return (
        <section className="w-full bg-white relative z-[1]">
            <div className="relative">
                
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Sola kaydır"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>

                
                <div
                    ref={scrollRef}
                    className="flex gap-0 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            className="group flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[calc(100vw/4)] lg:w-[calc(100vw/5)] xl:w-[calc(100vw/6)] relative"
                        >
                            
                            <div className="relative aspect-3/4 overflow-hidden bg-gray-100">
                                {category.image ? (
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 40vw, (max-width: 768px) 28vw, (max-width: 1024px) 22vw, 16vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                        <span className="text-gray-500 text-sm font-light">
                                            {category.name}
                                        </span>
                                    </div>
                                )}

                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

                                
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white text-sm md:text-base font-light tracking-wide uppercase text-center">
                                        {category.name}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Sağa kaydır"
                >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
            </div>
        </section>
    );
}
