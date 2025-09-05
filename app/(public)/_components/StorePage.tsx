"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

const media = [
  {
    type: "image",
    src: "https://res.cloudinary.com/dlahfchej/image/upload/v1757034488/e99cec90-f4e6-4dc0-807d-11f417c83cd1_l12pjv.jpg",
  },
  {
    type: "image",
    src: "https://res.cloudinary.com/dlahfchej/image/upload/v1757034495/IMG_0177_ec93z4.jpg",
  },
  {
    type: "image",
    src: "https://res.cloudinary.com/dlahfchej/image/upload/v1757034491/IMG_0190_wjhyc9.jpg",
  },
  {
    type: "image",
    src: "https://res.cloudinary.com/dlahfchej/image/upload/v1757034489/IMG_0194_x7dez2.jpg",
  },
  {
    type: "image",
    src: "https://res.cloudinary.com/dlahfchej/image/upload/v1757034491/IMG_0187_naburr.jpg",
  },
];

export default function StorePage() {
  const [selected, setSelected] = useState<{
    type: string;
    src: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragged = useRef(false);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -clientWidth : clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragged.current = false;
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
    dragged.current = true;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleClick = (item: { type: string; src: string }) => {
    if (!dragged.current) {
      setSelected(item);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Mağazamız</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Mağazamızdan kareler – ürünlerimizi ve ortamımızı keşfedin.
          </p>
        </div>

        {/* Sol-Sağ Butonlar */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white shadow border hover:bg-pink-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white shadow border hover:bg-pink-500 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Media List */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {media.map((item, i) => (
            <div
              key={i}
              className="relative min-w-[400px] h-[400px] snap-center rounded-xl overflow-hidden shadow hover:scale-[1.02] transition-transform"
              onClick={() => handleClick(item)}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src}
                  alt={`Mağaza medya ${i + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black/90 border-0 shadow-none">
          <DialogTitle className="sr-only">Mağaza medyası</DialogTitle>
          {selected && (
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              {selected.type === "image" ? (
                <Image
                  src={selected.src}
                  alt="Büyük görsel"
                  fill
                  className="object-contain"
                />
              ) : (
                <video
                  src={selected.src}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
