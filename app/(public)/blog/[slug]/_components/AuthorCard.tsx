import Image from "next/image";

export default function AuthorCard({
  name,
  bio,
  avatarUrl,
}: {
  name: string;
  bio: string;
  avatarUrl: string;
}) {
  return (
    <section className="mx-auto max-w-4xl mt-10 rounded-2xl border bg-white p-6 md:p-8">
      <div className="flex items-start gap-4">
        <Image
          src={avatarUrl}
          alt={name}
          width={72}
          height={72}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{bio}</p>
        </div>
      </div>
    </section>
  );
}
