"use client"

import Image from "next/image"
import Link from "next/link"
import { getAllPosts } from "@/lib/blogData"
import { useEffect, useState } from "react"
import { BlogPost } from "@/lib/types"

export default function BlogRecentPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    getAllPosts().then(setPosts)
  }, [])

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-l-4 pl-2 border-primary">
        Recent Post
      </h3>
      <div className="space-y-4">
        {posts.slice(0, 3).map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="flex items-center gap-3">
            <Image src={post.imageUrl} alt={post.title} width={60} height={60} className="rounded-md object-cover" />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">{new Date(post.date).toLocaleDateString("tr-TR")}</p>
              <p className="font-medium leading-snug">{post.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
