"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"

export default function BlogSearchBox() {
  const [keyword, setKeyword] = useState("")

  const handleSearch = () => {
    if (!keyword.trim()) return
    // Burada arama yönlendirmesi yapılabilir: /blog?search=...
    console.log("Search for:", keyword)
  }

  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter Keyword"
          className="flex-1"
        />
        <Button size="icon" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
