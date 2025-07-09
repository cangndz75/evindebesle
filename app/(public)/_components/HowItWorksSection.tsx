import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    title: "Bir evcil hayvan bakıcısı bulun",
    description: "Eğlenceli ve rahat deneyimler sunan doğrulanmış evcil hayvan bakıcılarını keşfedin.",
  },
  {
    title: "İlk toplantıyı planlayın",
    description: "Ücretsiz iletişimle tanışın ve tüm detayları konuşun.",
  },
  {
    title: "Nakit olmadan ödeme",
    description: "Online rezervasyon ve ödeme ile güvenli bir hizmet süreci başlatın.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-3">Nasıl Çalışır?</h2>
        <p className="text-muted-foreground mb-12">
          Güvenilir evcil hayvan bakıcılarını bulun ve iletişime geçin. 1, 2, 3 kadar kolay.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden hover:shadow-xl transition duration-300 hover:scale-[1.03] cursor-pointer"
            >
              <CardContent className="p-6 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xl">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
              <ArrowRight className="absolute right-4 bottom-4 text-blue-500 opacity-0 group-hover:opacity-100 transition duration-300" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
