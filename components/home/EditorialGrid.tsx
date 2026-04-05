"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CARDS = [
    {
        id: 1,
        category: "Çorap",
        title: "Gün Boyu Konfor Tarzını Tamamlayan Çoraplar",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771709822/banner2_jcc5j9.png",
        content: "Ayak sağlığınızı ön planda tutan, nefes alabilen kumaş yapısıyla gün boyu konfor sunan çorap koleksiyonumuz. Yumuşak dokusu ve şık tasarımlarıyla tarzınızı tamamlayın.",
        href: "/men",
    },
    {
        id: 2,
        category: "İç Giyim",
        title: "Zarafetin ve Rahatlığın Buluştuğu Siyah Body",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759838/3_org_zoom_dlegrk.webp",
        content: "Vücudu saran esnek yapısı ve sofistike tasarımıyla öne çıkan siyah body koleksiyonumuz. Her anınıza şıklık katan, ikinci cildiniz gibi hissettiren premium kalite.",
        href: "/women",
    },
    {
        id: 3,
        category: "Erkek İç Giyim",
        title: "Sıfır Dikiş Teknolojisiyle Beyaz İçlik",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759811/format_webp_2_pc9mhe.webp",
        content: "Sıfır dikiş teknolojisi ve antibakteriyel kumaşıyla tüm gün tazelik sunan erkek içlik koleksiyonu. Slim-fit kesimi sayesinde kıyafetlerinizin altında görünmez.",
        href: "/women",
    },
    {
        id: 4,
        category: "Korse",
        title: "Doğal Duruş ve Özgüvenli Silüet",
        image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771759818/bloomfitkorse_vu0myy.webp",
        content: "Yüksek bel tasarımı ve esnek kumaş yapısıyla vücudunuzu nazikçe şekillendiren korse koleksiyonumuz. Rahat kullanımı ile günlük hayatta özgüvenle hareket edin.",
        href: "/women",
    }
];

export default function EditorialGrid() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const router = useRouter();
    const selectedCard = CARDS.find((c) => c.id === selectedId);

    useEffect(() => {
        if (selectedId) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
    }, [selectedId]);

    return (
        <div className="w-full">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CARDS.map((card) => (
                    <motion.div
                        layoutId={`card-${card.id}`}
                        key={card.id}
                        onClick={() => setSelectedId(card.id)}
                        className="relative h-80 rounded-3xl overflow-hidden cursor-pointer group"
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
                            className="relative w-full max-w-2xl bg-[#111] rounded-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] h-auto"
                        >
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                className="absolute top-6 right-6 z-20 bg-black/40 text-white p-2 rounded-full hover:bg-black transition border border-white/10"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 5L5 15M5 5l10 10" />
                                </svg>
                            </button>

                            
                            <div className="relative w-full h-100 md:h-125">
                                <Image
                                    src={CARDS.find(c => c.id === selectedId)?.image || ""}
                                    alt="Detail"
                                    fill
                                    className="object-cover object-top"
                                />
                                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent" />

                                
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

                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="p-8 md:p-10 bg-[#111] text-white flex-1 relative"
                            >
                                <p className="text-gray-400 text-lg leading-relaxed mb-8 font-light max-w-xl">
                                    {selectedCard?.content}
                                </p>
                                <button
                                    onClick={() => {
                                        router.push("/");
                                    }}
                                    className="w-full md:w-auto px-8 bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
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
