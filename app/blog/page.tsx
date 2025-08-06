import { getAllPosts } from "@/lib/blogData"
import BlogCard from "./_components/BlogCard"
import BlogSidebar from "./_components/BlogSidebar"
import BlogPagination from "./_components/BlogPagination"


export default async function BlogHomePage() {
  const posts = await getAllPosts()

  return (
    <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8 py-10">
      <div className="lg:col-span-8 space-y-10">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
        <BlogPagination />
      </div>
      <div className="lg:col-span-4">
        <BlogSidebar />
      </div>
    </div>
  )
}
