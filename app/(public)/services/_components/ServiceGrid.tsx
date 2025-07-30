import { Utensils, Gamepad2, Sparkles, Stethoscope } from "lucide-react";

const services = [
  {
    title: "Evde Besleme",
    icon: Utensils,
    items: [
      "Mama ve su kontrolü",
      "Beslenme zamanlaması",
      "İlaç ve vitamin uygulaması",
      "Kamera ile gözlem",
      "Pet günlük kaydı",
    ],
  },
  {
    title: "Oyun ve Sosyalleşme",
    icon: Gamepad2,
    items: [
      "Kedi-köpek oyun seansları",
      "Yürüyüş / egzersiz",
      "Enerji takibi",
      "Fotoğraf & video paylaşımı",
      "Aktivite raporu",
    ],
  },
  {
    title: "Hijyen ve Temizlik",
    icon: Sparkles,
    items: [
      "Tuvalet temizliği",
      "Kap sterilizasyonu",
      "Tüy bakımı",
      "Alan havalandırması",
      "Dezenfekte işlemleri",
    ],
  },
  {
    title: "Günlük Takip ve Gözlem",
    icon: Stethoscope,
    items: [
      "Yeme-içme düzeni gözlemi",
      "Davranış ve enerji seviyesi takibi",
      "Tuvalet düzeni notları",
      "Acil durumda sizinle iletişim",
    ],
  },
];

export default function ServicesSection() {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <h2 className="text-[40px] font-semibold tracking-tight leading-tight">
          Hizmetlerimiz
        </h2>
        <p className="max-w-md text-muted-foreground text-sm text-right mt-6 md:mt-0">
          Evcil dostlarınız için sunduğumuz profesyonel bakım, hijyen ve oyun
          hizmetleriyle onların konforunu ve sağlığını önemsiyoruz.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-gray-200">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={index}
              className="border-r border-gray-200 px-6 py-10 last:border-r-0"
            >
              <div className="mb-6 text-primary">
                <Icon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-medium mb-4">{service.title}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                {service.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
