"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ShieldCheck, Zap, Scissors, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import HomeHeader from "@/components/home/HomeHeader";
import Footer from "@/components/home/FooterAccordion";

const stats = [
    { label: "MUTLU MÜŞTERİ", value: "25,000+" },
    { label: "KÜRESEL TESLİMAT", value: "50+ Ülke" },
    { label: "ÖZGÜN TASARIM", value: "1,200+" },
    { label: "MEMNUNİYET ORANI", value: "%99.9" },
];

const values = [
    {
        title: "Kusursuz İşçilik",
        description: "Her dikiş, her detay bir sanat eseri titizliğiyle işlenir. En kaliteli kumaşları, usta ellerle buluşturuyoruz.",
        icon: <Scissors className="w-6 h-6 text-white" />,
    },
    {
        title: "Üstün Konfor",
        description: "Dark Velvet sadece şıklık değil, aynı zamanda gün boyu süren bir özgürlük hissi vaat eder.",
        icon: <Zap className="w-6 h-6 text-white" />,
    },
    {
        title: "Küresel Vizyon",
        description: "İstanbul'dan dünyaya açılan bir stil hikayesi. Sınır tanımayan, modern ve zamansız bir moda anlayışı.",
        icon: <Globe className="w-6 h-6 text-white" />,
    },
];

export default function About2Page() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
            <HomeHeader />

            <main className="overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 md:pt-40 md:pb-60 flex flex-col items-center px-4 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-white/5 blur-[150px] rounded-full pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-center z-10 max-w-5xl"
                    >
                        <Badge className="mb-8 bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-2 transition-all text-[10px] tracking-[0.3em] uppercase rounded-none">
                            VİZYONUMUZ
                        </Badge>
                        <h1 className="text-6xl md:text-9xl font-serif font-light mb-10 leading-[1] tracking-tight text-white uppercase">
                            MODADA <br /> <span className="italic text-gray-400 font-normal">Kusursuz</span> DOKUNUŞ
                        </h1>
                        <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
                            Dark Velvet, lüks iç giyim ve modern sweatshirt koleksiyonlarıyla
                            sofistike bir yaşam tarzını temsil eder. Estetik ve konforu,
                            zamansız bir zarafetle harmanlıyoruz.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 1.2 }}
                        className="mt-20 relative w-full max-w-7xl aspect-[21/9] overflow-hidden shadow-3xl shadow-black border border-white/5"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1590736704728-f472d58e3bb5?q=80&w=2000"
                            alt="Dark Velvet Atölye"
                            fill
                            className="object-cover opacity-70 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                        <div className="absolute bottom-10 left-10 md:left-20">
                            <span className="text-[10px] tracking-[0.4em] uppercase text-white/50">EST. 2024</span>
                        </div>
                    </motion.div>
                </section>

                {/* Brand Mission Section */}
                <section className="py-32 bg-[#0F0F0F] relative">
                    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-24 items-center">
                        <div className="space-y-10">
                            <h2 className="text-5xl md:text-7xl font-serif font-light leading-tight uppercase tracking-tighter">
                                DARK <br /><span className="text-gray-500">VELVET</span> RUHU
                            </h2>
                            <div className="space-y-8">
                                <p className="text-gray-400 font-light leading-relaxed text-lg">
                                    Markamızın kalbinde, kadifenin gizemi ve karanlığın zarafeti yatar.
                                    Biz, sıradanlığın ötesine geçmek isteyenler için tasarlıyoruz.
                                    Her bir parçamız, kendinize olan güveninizi ve stilinizi yansıtan birer mühürdür.
                                </p>
                                <p className="text-gray-400 font-light leading-relaxed text-lg">
                                    Lüks iç giyimin hassasiyetini, sokak modasının en güçlü simgesi olan
                                    sweatshirt'lerle birleştirerek, gardırobunuzun en özel köşesini inşa ediyoruz.
                                    Kalite bizim için bir standart değil, bir yaşam biçimidir.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 pt-10 border-t border-white/5">
                                {stats.map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <p className="text-4xl font-serif text-white tracking-tighter">{stat.value}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 relative">
                            <div className="absolute -inset-4 bg-white/5 blur-[100px] pointer-events-none -z-10" />
                            <div className="space-y-6 pt-16">
                                <div className="overflow-hidden aspect-[3/4] border border-white/5 transition-transform duration-700 hover:scale-[1.02]">
                                    <Image src="https://images.unsplash.com/photo-1618221195710-dd6b41faeaa6?q=80&w=800" alt="Lingerie Detail" width={400} height={600} className="object-cover h-full grayscale brightness-75 hover:grayscale-0 transition-all duration-700" />
                                </div>
                                <div className="overflow-hidden aspect-[4/5] border border-white/5 transition-transform duration-700 hover:scale-[1.02]">
                                    <Image src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800" alt="Fabric Quality" width={400} height={500} className="object-cover h-full brightness-75 hover:brightness-100 transition-all duration-700" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="overflow-hidden aspect-[4/5] border border-white/5 transition-transform duration-700 hover:scale-[1.02]">
                                    <Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800" alt="Creative Studio" width={400} height={500} className="object-cover h-full grayscale brightness-75 hover:grayscale-0 transition-all duration-700" />
                                </div>
                                <div className="overflow-hidden aspect-[3/4] border border-white/5 transition-transform duration-700 hover:scale-[1.02]">
                                    <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800" alt="Modern Styling" width={400} height={600} className="object-cover h-full brightness-75 hover:brightness-100 transition-all duration-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full" />

                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-20 space-y-6">
                            <Badge variant="outline" className="border-white/20 text-white/50 rounded-none px-4 py-1 uppercase tracking-[0.3em] text-[10px]">İLKELERİMİZ</Badge>
                            <h2 className="text-5xl md:text-7xl font-serif font-light text-white uppercase tracking-tight">KUSURSUZLUĞUN <span className="italic text-gray-500">TEMELLERİ</span></h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {values.map((value, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -15 }}
                                    className="group p-10 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-700 relative"
                                >
                                    <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-10 group-hover:bg-white/10 transition-colors border border-white/10">
                                        {value.icon}
                                    </div>
                                    <h3 className="text-2xl font-serif font-light mb-6 uppercase tracking-widest">{value.title}</h3>
                                    <p className="text-gray-400 font-light leading-relaxed text-sm tracking-wide">{value.description}</p>
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-white/0 group-hover:border-white/20 transition-all duration-700" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 px-4">
                    <div className="max-w-7xl mx-auto overflow-hidden relative p-16 md:p-32 text-center group border border-white/5">
                        <Image
                            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2000"
                            alt="Collection Background"
                            fill
                            className="object-cover opacity-20 transition-transform duration-[3s] group-hover:scale-110 select-none pointer-events-none grayscale"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 to-[#0A0A0A]" />

                        <div className="relative z-10 space-y-12">
                            <h2 className="text-5xl md:text-8xl font-serif font-light leading-[1.1] uppercase tracking-tighter">
                                STİLİNİZİ <br /> <span className="italic text-gray-500">YENİDEN</span> TANIMLAYIN
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <Link href="/products">
                                    <Button size="lg" className="bg-white hover:bg-gray-200 text-black rounded-none px-16 h-16 text-sm font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl">
                                        KOLEKSİYONU KEŞFET
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/5 text-white rounded-none px-16 h-16 text-sm font-light uppercase tracking-[0.2em] backdrop-blur-sm transition-all">
                                        BİZE ULAŞIN
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
