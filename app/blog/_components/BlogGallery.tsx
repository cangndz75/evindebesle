import Image from "next/image"

export default function BlogGallery() {
  const images = [
    "https://res.cloudinary.com/dlahfchej/image/upload/v1754342419/cj1prnbaiktcfpgz1o10.png",
    "https://res.cloudinary.com/dlahfchej/image/upload/v1754342419/cj1prnbaiktcfpgz1o10.png",
    "https://res.cloudinary.com/dlahfchej/image/upload/v1754342419/cj1prnbaiktcfpgz1o10.png",
    "https://res.cloudinary.com/dlahfchej/image/upload/v1754342419/cj1prnbaiktcfpgz1o10.png",
    "https://res.cloudinary.com/dlahfchej/image/upload/v1754342419/cj1prnbaiktcfpgz1o10.png",
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-l-4 pl-2 border-primary">
        Gallery
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <Image
            key={i}
            src={src}
            alt={`Gallery ${i + 1}`}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        ))}
      </div>
    </div>
  )
}
