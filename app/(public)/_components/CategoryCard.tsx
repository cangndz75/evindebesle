import Image from "next/image";

interface Props {
  title: string;
}

export default function CategoryCard({ title }: Props) {
  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer">
      <div className="w-24 h-24 relative mb-4">
        <Image
          src="/logo.png"
          alt={title}
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-md font-semibold text-gray-800">{title}</h3>
    </div>
  );
}
