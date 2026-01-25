export default function TagList({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold">Etiketler:</span>
      {tags.map((t) => (
        <span
          key={t}
          className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
