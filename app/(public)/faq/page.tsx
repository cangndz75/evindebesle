"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search, HelpCircle, Package, CreditCard, Truck, RotateCcw, User, ShoppingBag } from "lucide-react";
import { sanitizeHtmlForRender } from "@/lib/security/sanitizeHtml";


interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    order: { label: "Sipariş", icon: <ShoppingBag className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
    payment: { label: "Ödeme", icon: <CreditCard className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
    shipping: { label: "Kargo", icon: <Truck className="w-5 h-5" />, color: "bg-orange-100 text-orange-700" },
    return: { label: "İade", icon: <RotateCcw className="w-5 h-5" />, color: "bg-red-100 text-red-700" },
    product: { label: "Ürün", icon: <Package className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
    account: { label: "Hesap", icon: <User className="w-5 h-5" />, color: "bg-indigo-100 text-indigo-700" },
};

export default function SSSPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [grouped, setGrouped] = useState<Record<string, FAQ[]>>({});
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch("/api/admin/faq");
                if (res.ok) {
                    const data = await res.json();
                    setFaqs(data.faqs || []);
                    setGrouped(data.grouped || {});
                }
            } catch (error) {
                console.error("Error fetching FAQs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const filteredFaqs = searchQuery
        ? faqs.filter(
            faq =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : activeCategory
            ? faqs.filter(faq => faq.category === activeCategory)
            : faqs;

    const displayGrouped = searchQuery
        ? { results: filteredFaqs }
        : activeCategory
            ? { [activeCategory]: filteredFaqs }
            : grouped;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            
            <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Sıkça Sorulan Sorular</h1>
                    <p className="text-gray-300 mb-8">Size nasıl yardımcı olabiliriz?</p>

                    
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Soru ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                
                {!searchQuery && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === null
                                ? "bg-gray-900 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            Tümü
                        </button>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === key
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {config.icon}
                                {config.label}
                            </button>
                        ))}
                    </div>
                )}

                
                {Object.entries(displayGrouped).map(([category, items]) => (
                    <div key={category} className="mb-8">
                        {!searchQuery && category !== "results" && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${categoryConfig[category]?.color || "bg-gray-100"}`}>
                                    {categoryConfig[category]?.icon || <HelpCircle className="w-5 h-5" />}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {categoryConfig[category]?.label || category}
                                </h2>
                            </div>
                        )}

                        <div className="space-y-3">
                            {(items as FAQ[]).map((faq) => (
                                <div
                                    key={faq.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleExpand(faq.id)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${expandedIds.has(faq.id) ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>
                                    {expandedIds.has(faq.id) && (
                                        <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                                            <div className="pt-4" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(faq.answer) }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Sonuç bulunamadı</p>
                        <p className="text-sm mt-2">Farklı bir arama terimi deneyin</p>
                    </div>
                )}

                
                <div className="mt-12 p-6 bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aradığınızı bulamadınız mı?</h3>
                    <p className="text-gray-600 mb-4">Destek ekibimiz size yardımcı olmaktan mutluluk duyar.</p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Bize Ulaşın
                    </a>
                </div>
            </div>

        </div>
    );
}
