"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCarousel from "./ProductCarousel";
import type { Product } from "@/lib/homeData";

interface TabbedBestSellersProps {
  bestSellersWomen: Product[];
  bestSellersMen: Product[];
}

export default function TabbedBestSellers({ bestSellersWomen, bestSellersMen }: TabbedBestSellersProps) {
  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="w-full px-4 md:px-6">
        <Tabs defaultValue="women" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="women"
                className="px-6 py-3 text-sm font-light uppercase tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-[#111] data-[state=active]:bg-transparent rounded-none"
              >
                Kadın
              </TabsTrigger>
              <TabsTrigger
                value="men"
                className="px-6 py-3 text-sm font-light uppercase tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-[#111] data-[state=active]:bg-transparent rounded-none"
              >
                Erkek
              </TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex gap-4">
              <Link
                href="/women/best-sellers"
                className="text-sm font-light text-[#111] hover:opacity-70 transition-opacity uppercase tracking-wide"
              >
                Kadın Tümünü Gör
              </Link>
              <Link
                href="/men/best-sellers"
                className="text-sm font-light text-[#111] hover:opacity-70 transition-opacity uppercase tracking-wide"
              >
                Erkek Tümünü Gör
              </Link>
            </div>
          </div>
          <TabsContent value="women" className="mt-0">
            <ProductCarousel title="KADIN EN ÇOK SATANLAR" products={bestSellersWomen} />
          </TabsContent>
          <TabsContent value="men" className="mt-0">
            <ProductCarousel title="ERKEK EN ÇOK SATANLAR" products={bestSellersMen} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
