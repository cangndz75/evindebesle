import Image from "next/image";
import w1 from "@/public/lgoo.png";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-900 mb-4 mt-0">
            Tarzınla öne çık <br /> her gün iyi hisset
          </h1>
          <p className="text-base md:text-lg text-gray-700 mb-8">
            Günlük kombinlerden özel anlara uzanan seçkilerle stilini yenile.
            Sezonun öne çıkan parçalarını tek yerde keşfet.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden">
          <Image
            src={w1}
            alt="Modern koleksiyon"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
