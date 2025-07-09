import Image from "next/image";
import w1 from "@/public/w1.png";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-4">
            Evcil hayvanlarınız için <br /> güvenilir evde bakım hizmeti
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Kediniz, köpeğiniz ya da diğer dostlarınız evinizde özenle bakılsın.
            Deneyimli ve hayvansever bakıcılarla tanışın.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden">
          <Image src={w1} alt="Köpek ve kedi" className="w-full h-auto object-cover" />
        </div>
      </div>
    </section>
  );
}
