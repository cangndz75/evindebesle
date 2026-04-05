"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const CARDS = [
    {
        id: 1,
        category: "Ã‡orap",
        title: "GÃ¼n Boyu Konfor TarzÄ±nÄ± Tamamlayan Ã‡oraplar",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771709822/banner2_jcc5j9.png",
        content: "Ayak saÄŸlÄ±ÄŸÄ±nÄ±zÄ± Ã¶n planda tutan, nefes alabilen kumaÅŸ yapÄ±sÄ±yla gÃ¼n boyu konfor sunan Ã§orap koleksiyonumuz. YumuÅŸak dokusu ve ÅŸÄ±k tasarÄ±mlarÄ±yla tarzÄ±nÄ±zÄ± tamamlayÄ±n.",
    },
    {
        id: 2,
        category: "Ä°Ã§ Giyim",
        title: "Zarafetin ve RahatlÄ±ÄŸÄ±n BuluÅŸtuÄŸu Siyah Body",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759838/3_org_zoom_dlegrk.webp",
        content: "VÃ¼cudu saran esnek yapÄ±sÄ± ve sofistike tasarÄ±mÄ±yla Ã¶ne Ã§Ä±kan siyah body koleksiyonumuz. Her anÄ±nÄ±za ÅŸÄ±klÄ±k katan, ikinci cildiniz gibi hissettiren premium kalite.",
    },
    {
        id: 3,
        category: "Erkek Ä°Ã§ Giyim",
        title: "SÄ±fÄ±r DikiÅŸ Teknolojisiyle Beyaz Ä°Ã§lik",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759811/format_webp_2_pc9mhe.webp",
        content: "SÄ±fÄ±r dikiÅŸ teknolojisi ve antibakteriyel kumaÅŸÄ±yla tÃ¼m gÃ¼n tazelik sunan erkek iÃ§lik koleksiyonu. Slim-fit kesimi sayesinde kÄ±yafetlerinizin altÄ±nda gÃ¶rÃ¼nmez.",
    },
    {
        id: 4,
        category: "Korse",
        title: "DoÄŸal DuruÅŸ ve Ã–zgÃ¼venli SilÃ¼et",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759818/bloomfitkorse_vu0myy.webp",
        content: "YÃ¼ksek bel tasarÄ±mÄ± ve esnek kumaÅŸ yapÄ±sÄ±yla vÃ¼cudunuzu nazikÃ§e ÅŸekillendiren korse koleksiyonumuz. Rahat kullanÄ±mÄ± ile gÃ¼nlÃ¼k hayatta Ã¶zgÃ¼venle hareket edin.",
    }
];

export default function EditorialGrid() {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (selectedId) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
    }, [selectedId]);

    return (
        <div className="w-full">
            {/* Grid YapÄ±sÄ± */}
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
                        <motion.div className={`absolute inset-0 ${card.id === 1 ? 'bg-[#f5f5f5]' : ''}`}>
                            <Image
                                src={card.image}
                                alt={card.title}
                                fill
                                className={`${card.id === 1 ? 'object-contain p-4' : 'object-cover object-top'} transition-transform duration-500 group-hover:scale-105`}
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

            {/* GeniÅŸleyen Kart (Overlay) */}
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

                            {/* Ãœst: GÃ¶rsel (Taller) */}
                            <div className="relative w-full h-[400px] md:h-[500px]">
                                <Image
                                    src={CARDS.find(c => c.id === selectedId)?.image || ""}
                                    alt="Detail"
                                    fill
                                    className="object-cover object-top"
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

                            {/* Alt: Ä°Ã§erik (Dark) */}
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
                                    KeÅŸfetmeye BaÅŸla
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
