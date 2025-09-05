"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  petTags: string[];
  image?: string | null;
};

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error("Hizmetler alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -clientWidth : clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <section className="py-16 bg-gray-50 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Hizmetlerimiz</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Evcil dostlarınız için güvenilir, sevgi dolu ve profesyonel
            hizmetlerimizi keşfedin.
          </p>
        </div>

        <div className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border hover:bg-pink-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border hover:bg-pink-500 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="min-w-[300px] md:min-w-[350px] snap-center animate-pulse"
                >
                  <div className="h-40 bg-gray-200 rounded-t-lg" />
                  <CardHeader>
                    <CardTitle className="h-6 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            : services.map((service) => {
                const isExpanded = expanded === service.id;
                const shortDesc =
                  service.description && service.description.length > 100
                    ? service.description.slice(0, 100) + "..."
                    : service.description;

                return (
                  <Card
                    key={service.id}
                    className="relative min-w-[300px] md:min-w-[350px] snap-center hover:shadow-xl hover:scale-[1.02] transition-transform bg-white rounded-2xl"
                  >
                    <div className="h-40 rounded-t-2xl relative overflow-hidden">
                      {service.image ? (
                        <Image
                          src={service.image}
                          alt={service.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-pink-200 to-pink-300 flex items-center justify-center">
                          <span className="text-5xl">🐾</span>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        {service.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pb-12">
                      <p className="text-gray-600 text-sm mb-2">
                        {isExpanded ? service.description : shortDesc}
                      </p>
                      {service.description &&
                        service.description.length > 100 && (
                          <button
                            onClick={() =>
                              setExpanded(isExpanded ? null : service.id)
                            }
                            className="text-pink-600 text-xs hover:underline"
                          >
                            {isExpanded ? "Kısalt" : "Devamını gör"}
                          </button>
                        )}

                      {service.petTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 my-3">
                          {service.petTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-pink-100 text-pink-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4">
                        <span className="text-xl font-bold text-gray-800">
                          {service.price.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>
    </section>
  );
}
