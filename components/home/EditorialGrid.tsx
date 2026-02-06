"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const CARDS = [
    {
        id: 1,
        category: "Travel",
        title: "5 Inspiring Apps for Your Next Trip",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200",
        content: "Love to travel? So do the makers of these five subscription apps. For a small monthly fee, they'll help you find the best deals on flights, hotels, and some other stuff we turn a blind eye to. Plan your perfect itinerary with intelligent recommendations based on your interests, time, and credit history.",
    },
    {
        id: 2,
        category: "How to",
        title: "Contemplate the Meaning of Life Twice a Day",
        image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1200",
        content: "What is life? You can't spell 'life' without 'i'. You also can't spell 'life' without 'l', 'f', and 'e'. Worth thinking about. The only way to find out more about life is to think about it. And the only way to think about it is twice daily using an app. Apps? We got 'em. Therefore we got the meaning of life.",
    },
    {
        id: 3,
        category: "Steps",
        title: "Urban Exploration Apps for the Vertically-Inclined",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
        content: "Scale new heights with our curated list of apps designed for modern explorers. From rooftop garden finders to historical staircase maps, your city has never looked so vertical.",
    },
    {
        id: 4,
        category: "Hats",
        title: "Take Control of Your Hat Life With This Stunning New App",
        image: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?q=80&w=1200",
        content: "Managing a multi-hat lifestyle is exhausting. This app helps you catalog your collection, track wear-frequency, and even suggests the best hat for today's weather and your social standing.",
    }
];

export default function EditorialGrid() {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Kart açıkken sayfanın kaymasını engelle
    useEffect(() => {
        if (selectedId) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
    }, [selectedId]);

    return (
        <div className="w-full">
            {/* Grid Yapısı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CARDS.map((card) => (
                    <motion.div
                        layoutId={`card-${card.id}`}
                        key={card.id}
                        onClick={() => setSelectedId(card.id)}
                        className="relative h-[320px] rounded-3xl overflow-hidden cursor-pointer group"
                        whileHover={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <motion.div className="absolute inset-0">
                            <Image
                                src={card.image}
                                alt={card.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        </motion.div>

                        <div className="relative h-full p-6 flex flex-col justify-end">
                            <motion.span layoutId={`category-${card.id}`} className="text-white/80 text-xs font-medium uppercase tracking-widest mb-2">
                                {card.category}
                            </motion.span>
                            <motion.h3 layoutId={`title-${card.id}`} className="text-white text-xl font-bold leading-tight max-w-[90%]">
                                {card.title}
                            </motion.h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Genişleyen Kart (Overlay) */}
            <AnimatePresence>
                {selectedId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            layoutId={`card-${selectedId}`}
                            className="relative w-full max-w-2xl bg-[#111] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] h-auto"
                        >
                            {/* Kapat Butonu */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                className="absolute top-6 right-6 z-20 bg-black/40 text-white p-2 rounded-full hover:bg-black transition border border-white/10"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 5L5 15M5 5l10 10" />
                                </svg>
                            </button>

                            {/* Üst: Görsel (Taller) */}
                            <div className="relative w-full h-[400px] md:h-[500px]">
                                <Image
                                    src={CARDS.find(c => c.id === selectedId)?.image || ""}
                                    alt="Detail"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

                                {/* Text Overlay on Image (Top-Left) */}
                                <div className="absolute top-8 left-8 z-10 pr-12">
                                    <motion.span
                                        layoutId={`category-${selectedId}`}
                                        className="text-white/90 text-xs font-bold uppercase tracking-widest mb-3 block"
                                    >
                                        {CARDS.find(c => c.id === selectedId)?.category}
                                    </motion.span>
                                    <motion.h3
                                        layoutId={`title-${selectedId}`}
                                        className="text-white text-3xl md:text-5xl font-serif font-light leading-tight"
                                    >
                                        {CARDS.find(c => c.id === selectedId)?.title}
                                    </motion.h3>
                                </div>
                            </div>

                            {/* Alt: İçerik (Dark) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="p-8 md:p-10 bg-[#111] text-white flex-1 relative"
                            >
                                <p className="text-gray-400 text-lg leading-relaxed mb-8 font-light max-w-xl">
                                    {CARDS.find(c => c.id === selectedId)?.content}
                                </p>
                                <button className="w-full md:w-auto px-8 bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                    Keşfetmeye Başla
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
