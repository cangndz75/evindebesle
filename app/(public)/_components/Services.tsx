import { serviceGroups } from "@/lib/data/services";
import ServiceCard from "./ServiceCard";

export default function Services() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Evcil dostlarınız için uygun bakım seçeneklerini keşfedin
        </h2>
        <p className="text-center text-gray-600 mb-12">
          İster evde ister dışarda, hayvanınıza en uygun hizmeti seçin
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {serviceGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {group.title}
              </h3>
              <div className="grid gap-4">
                {group.items.map((item) => (
                  <ServiceCard
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
