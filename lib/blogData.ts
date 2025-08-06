export type BlogPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl: string
  date: string
  author: string
  tags: string[]
  category: string
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return [
    {
      title: "Overcame breeding point concerns has terminate actual is monitoring.",
      slug: "overcame-breeding-point",
      excerpt: "Bndulgence diminution so discovered mr apartments. Are off under folly...",
      content: "...",
      imageUrl: "https://res.cloudinary.com/dlahfchej/image/upload/v1752648370/evindebesle/rfsqeqbkamu9qq4o6lkm.png",
      date: "2023-04-25",
      author: "Istiak Ahmed",
      tags: ["Fashion", "Health"],
      category: "Health"
    },
    // Diğer bloglar...
  ]
}
