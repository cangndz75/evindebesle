"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter signup logic
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <section className="w-full bg-white py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-4">
          Yeni Koleksiyonlardan Haberdar Ol
        </h2>
        <p className="text-base md:text-lg text-[#111]/70 font-light mb-8 max-w-2xl mx-auto">
          Özel kampanyalar, yeni ürünler ve stil önerileri için e-posta listemize katılın.
        </p>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="flex-1 border-[#111] bg-white focus-visible:ring-[#111]"
              required
            />
            <Button
              type="submit"
              className="px-8 bg-[#111] text-white hover:bg-[#111]/90 uppercase tracking-wide font-light"
            >
              Katıl
            </Button>
          </div>
          <p className="text-xs text-[#111]/60 font-light mt-3 underline">
            Gizlilik politikamızı okuyun
          </p>
        </form>
      </div>
    </section>
  );
}
