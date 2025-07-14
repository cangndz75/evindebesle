import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-between px-6 py-20">
      <div className="max-w-xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Evde Hayvan Bakımıyla <br /> Rahatlığı Evinize Taşıyın
        </h1>
        <p className="text-muted-foreground">
          Uzman bakıcılarımız, evcil dostlarınızı kendi evlerinde güvenle ve sevgiyle besler, oyun oynar, hijyenini sağlar ve sağlığını takip eder.
        </p>
      </div>
      <div className="mt-0 lg:mt-0">
        <Image
          src="https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Evcil hayvan bakımı"
          width={600}
          height={400}
          className="rounded-xl object-cover"
        />
      </div>
    </section>
  )
}
