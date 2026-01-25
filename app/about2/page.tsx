"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRight, Heart, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ModernNavbar from "../(public)/_components/ModernNavbar";
import Footer from "../(public)/_components/Footer";

const stats = [
    { label: "Mutlu Evcil Dost", value: "10,000+" },
    { label: "Uzman Bakıcı", value: "500+" },
    { label: "Şehir", value: "12" },
    { label: "Müşteri Memnuniyeti", value: "%99.8" },
];

const values = [
    {
        title: "Şeffaflık",
        description: "Sürecin her anında yanınızdayız. Görüntülü raporlar ve anlık bildirimlerle içiniz hep rahat.",
        icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    },
    {
        title: "Güvenlik",
        description: "Tüm bakıcılarımız titizlikle seçilir ve kapsamlı bir güvenlik kontrolünden geçer.",
        icon: <ShieldCheck className="w-6 h-6 text-amber-500" />,
    },
    {
        title: "Tutku",
        description: "Biz sadece bir platform değil, hayvanseverlerden oluşan büyük bir aileyiz.",
        icon: <Heart className="w-6 h-6 text-amber-500" />,
    },
];

export default function About2Page() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-amber-500/30">
            <ModernNavbar />

            <main className="overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 md:pt-32 md:pb-52 flex flex-col items-center px-4 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center z-10 max-w-4xl"
                    >
                        <Badge className="mb-6 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 px-4 py-1.5 transition-all text-xs tracking-widest uppercase">
                            Bizim Hikayemiz
                        </Badge>
                        <h1 className="text-5xl md:text-8xl font-serif font-light mb-8 leading-[1.1] tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                            Sevgi Dolu Bir <br /> <span className="italic text-amber-500 font-normal">Gelecek</span> İnşa Ediyoruz
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
                            Evcil dostlarınıza güvenilir, sevgi dolu ve profesyonel bir bakım sunmak için yola çıktık.
                            Geleneksel pet bakımını modern teknoloji ve butik hizmet anlayışıyla yeniden tanımlıyoruz.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="mt-16 relative w-full max-w-6xl aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl shadow-black border border-white/5"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2000"
                            alt="Hikayemiz"
                            fill
                            className="object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                    </motion.div>
                </section>

                {/* Brand Mission Section */}
                <section className="py-24 bg-[#0F0F0F] relative">
                    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-serif font-light leading-tight">
                                Neden <span className="text-amber-500">Dark Velvet</span>?
                            </h2>
                            <div className="space-y-6">
                                <p className="text-gray-400 font-light leading-relaxed">
                                    Evcil dostlarınız bizim için sadece birer hayvan değil, ailenizin birer parçası.
                                    "Dark Velvet" isminin arkasında yatan gizem ve zarafet, onlara sunduğumuz
                                    yumuşak ama bir o kadar da güçlü koruma hissini temsil ediyor.
                                </p>
                                <p className="text-gray-400 font-light leading-relaxed">
                                    Modayı, konforu ve güvenliği tek bir çatı altında toplayarak, hem patili dostlarımızın
                                    stiline hem de mutluluğuna odaklanan premium bir e-ticaret ve hizmet ekosistemi yaratıyoruz.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-8">
                                {stats.map((stat, i) => (
                                    <div key={i} className="space-y-1">
                                        <p className="text-3xl font-serif text-white">{stat.value}</p>
                                        <p className="text-xs text-amber-500/70 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4 pt-12">
                                <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-white/5 shadow-xl">
                                    <Image src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=800" alt="Dog" width={400} height={600} className="object-cover h-full" />
                                </div>
                                <div className="rounded-2xl overflow-hidden aspect-[4/5] border border-white/5 shadow-xl">
                                    <Image src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800" alt="Cat" width={400} height={500} className="object-cover h-full" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden aspect-[4/5] border border-white/5 shadow-xl">
                                    <Image src="https://images.unsplash.com/photo-1513245538863-17a35b2174e1?q=80&w=800" alt="Dog" width={400} height={500} className="object-cover h-full" />
                                </div>
                                <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-white/5 shadow-xl">
                                    <Image src="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800" alt="Cat" width={400} height={600} className="object-cover h-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[100px] rounded-full" />

                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-serif font-light italic text-amber-500">Değerlerimiz</h2>
                            <p className="text-gray-400 max-w-xl mx-auto font-light">Bizi biz yapan, her kararımızın merkezinde yer alan ilkelerimiz.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {values.map((value, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -10 }}
                                    className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-amber-500/50 transition-all duration-500"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-8 group-hover:bg-amber-500/20 transition-colors">
                                        {value.icon}
                                    </div>
                                    <h3 className="text-2xl font-serif font-light mb-4">{value.title}</h3>
                                    <p className="text-gray-400 font-light leading-relaxed">{value.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-4">
                    <div className="max-w-5xl mx-auto rounded-[3rem] overflow-hidden relative p-12 md:p-24 text-center">
                        <Image
                            src="https://images.unsplash.com/photo-1544191746-e41bf97170db?q=80&w=2000"
                            alt="CTA Background"
                            fill
                            className="object-cover opacity-30 select-none pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/40 to-[#0A0A0A]" />

                        <div className="relative z-10 space-y-10">
                            <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight">
                                Dostlarınızın Dünyasına <br /> <span className="text-amber-500">Zarafet</span> Katın
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link href="/products">
                                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black rounded-full px-12 h-14 text-base font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20">
                                        Koleksiyonları Keşfet <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="/services">
                                    <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/5 text-white rounded-full px-12 h-14 text-base font-light backdrop-blur-sm transition-all">
                                        Hizmetlerimize Göz At
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
