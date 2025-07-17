import Image from "next/image";
import w1 from "@/public/w1.png";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-900 mb-4 mt-0">
            Evcil hayvanlarınız <br /> evde güvenle bakılsın
          </h1>
          <p className="text-base md:text-lg text-gray-700 mb-8">
            Kediniz, köpeğiniz ya da diğer dostlarınız evinizde özenle bakılsın.
            Deneyimli ve hayvansever bakıcılarla tanışın.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden">
          <Image
            src={w1}
            alt="Köpek ve kedi"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
