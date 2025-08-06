import Navbar from "@/app/(public)/_components/Navbar";
import BlogCategoryList from "./BlogCategoryList";
import BlogGallery from "./BlogGallery";
import BlogRecentPosts from "./BlogRecentPosts";
import BlogSearchBox from "./BlogSearchBox";
import BlogTags from "./BlogTags";

export default function BlogSidebar() {
  return (
    <div className="space-y-10">
      <BlogSearchBox />
      <BlogRecentPosts />
      <BlogCategoryList />
      <BlogGallery />
      <BlogTags />
    </div>
  );
}
