import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-center text-center lg:text-left px-6 py-16 lg:py-24 gap-10">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Evde Hayvan Bakımıyla <br /> Rahatlığı Evinize Taşıyın
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Uzman bakıcılarımız, evcil dostlarınızı kendi evlerinde güvenle ve
          sevgiyle besler, oyun oynar, hijyenini sağlar ve sağlığını takip eder.
        </p>
      </div>

      <div className="max-w-sm w-full">
        <Image
          src="https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Evcil hayvan bakımı"
          width={480}
          height={360}
          className="rounded-xl object-cover w-full h-auto"
        />
      </div>
    </section>
  );
}
