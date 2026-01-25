import Image from "next/image";
import { BlogPost } from "@/lib/types";

export default function BlogHero({ post }: { post: BlogPost }) {
  const d = new Date(post.date);
  const pretty = d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="relative w-full h-56 md:h-80 lg:h-96">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="px-5 md:px-10 pt-6 md:pt-10">
        <p className="text-sm text-muted-foreground">
          {post.author} • {pretty}
        </p>
        <h1 className="mt-2 text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
          {post.title}
        </h1>
      </div>
    </>
  );
}
