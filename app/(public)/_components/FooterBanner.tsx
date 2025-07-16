import React from "react";

export default function FooterBanner() {
  return (
    <section className="bg-[#003737] text-white px-6 md:px-24 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <img
            src="https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png"
            alt="Evinde Besle"
            className="w-32 md:w-40"
            width={160}
            height={40}
          />
          <div className="hidden md:block h-20 border-l-[1px] border-[#d5ff4b]" />
        </div>

        <div className="text-center md:text-left text-lg md:text-2xl font-medium leading-snug max-w-3xl">
          Evcil dostlarımızı evlerinde besleyerek{" "}
          <span className="text-[#d5ff4b] font-semibold">hayvanlara</span>,{" "}
          <span className="text-[#d5ff4b] font-semibold">insanlara</span> ve{" "}
          <span className="text-[#d5ff4b] font-semibold">doğaya</span> olan
          sorumluluğumuzu yerine getiriyoruz.
        </div>
      </div>
    </section>
  );
}
