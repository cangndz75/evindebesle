export default function BlogTags() {
  const tags = ["Fashion", "Education", "Nation", "Study", "Health", "Food"]

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-l-4 pl-2 border-primary">
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="bg-muted text-sm px-3 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
