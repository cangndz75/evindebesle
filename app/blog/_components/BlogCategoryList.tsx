export default function BlogCategoryList() {
  const categories = [
    { name: "National", count: 69 },
    { name: "International", count: 25 },
    { name: "Sports", count: 18 },
    { name: "Magazine", count: 37 },
    { name: "Health", count: 12 },
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-l-4 pl-2 border-primary">
        Category List
      </h3>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.name} className="flex justify-between text-sm">
            <span>{cat.name}</span>
            <span className="bg-muted px-2 py-1 rounded-full text-xs">{cat.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
