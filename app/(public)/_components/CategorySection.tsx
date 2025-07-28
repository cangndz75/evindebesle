import CategoryCard from "./CategoryCard";

const categories = [
  // "Çocuk Bakımı",
  // "Yaşlı Bakımı",
  // "Yetişkin Destek",
  // "Ev Temizliği",
  "Evcil Hayvan Bakımı",
  "Evcil Hayvan Besleme",
  "Mama ve Aksesuar",
  // "Özel Ders",
];

export default function CategorySection() {
  return (
    <section className="bg-neutral-50 py-16 ">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-10">
          Milyonlarca ailenin tercih ettiği hizmetler
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-center">
          {categories.map((title) => (
            <CategoryCard key={title} title={title} />
          ))}
        </div>
      </div>
    </section>
  );
}
