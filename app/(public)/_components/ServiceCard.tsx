interface Props {
  icon: string;
  title: string;
  description: string;
}

export default function ServiceCard({ icon, title, description }: Props) {
  return (
    <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <div className="text-2xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
