export type NavItem = {
  label: string;
  href: string;
};

export type Category = {
  id: string;
  label: string;
  image: string;
  href: string;
};

export type Product = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  badge?: "Yeni" | "İndirim";
  colors?: string[];
  sizes?: Array<{ name: string; stock: number; id?: string }>;
  sizeOptions?: Array<{ name: string; id?: string }>;
  colorId?: string;
  variants?: Array<{ colorId: string | null; sizeId: string | null; stock: number }>;
};

export type Tile = {
  title: string;
  subtitle?: string;
  image: string;
  href: string;
};

export type BrandItem = {
  id: string;
  title: string;
  href: string;
  image: string;
};

export const navItems: NavItem[] = [
  { label: "Erkek", href: "/men" },
  { label: "Kadın", href: "/women" },
  { label: "Yeni", href: "/new" },
  { label: "Koleksiyon", href: "/collections" },
  { label: "Setler", href: "/sets" },
  { label: "Outlet", href: "/outlet" },
];

export const categories: Category[] = [
  {
    id: "long-sleeve",
    label: "Uzun Kollu",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/long-sleeve",
  },
  {
    id: "short-sleeve",
    label: "Kısa Kollu",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/short-sleeve",
  },
  {
    id: "pants",
    label: "Pantolon",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/pants",
  },
  {
    id: "shirt",
    label: "Gömlek",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/shirt",
  },
  {
    id: "sets",
    label: "Takımlar",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/sets",
  },
  {
    id: "accessories",
    label: "Aksesuar",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/category/accessories",
  },
];

export const newArrivals: Product[] = [
  {
    id: "1",
    title: "Premium Dantel Sütyen",
    price: 899,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    badge: "Yeni",
    colors: ["#000000", "#ffffff", "#C9B79C"],
  },
  {
    id: "2",
    title: "Seamless Günlük Külot",
    price: 349,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#ffffff", "#C9B79C", "#d4a574"],
  },
  {
    id: "3",
    title: "Saten İpek Takım",
    price: 1299,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    badge: "Yeni",
    colors: ["#ffffff", "#C9B79C"],
  },
  {
    id: "4",
    title: "Transparan Dantel Body",
    price: 1499,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    badge: "Yeni",
    colors: ["#000000", "#ffffff"],
  },
  {
    id: "5",
    title: "Wireless Sütyen",
    price: 749,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#ffffff", "#C9B79C"],
  },
  {
    id: "6",
    title: "High-Waist Külot",
    price: 449,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#C9B79C", "#d4a574"],
  },
];

export const bestSellersWomen: Product[] = [
  {
    id: "w1",
    title: "Kadın Journey Hi-Pile Jacket",
    price: 1200,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    badge: "Yeni",
    colors: ["#d4a574", "#000000", "#ffffff"],
  },
  {
    id: "w2",
    title: "Drift Uzun Kollu",
    price: 450,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#808080", "#ffffff"],
  },
  {
    id: "w3",
    title: "Serene Shacket",
    price: 800,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#d4a574", "#8b6f47"],
  },
  {
    id: "w4",
    title: "Kadın Günlük Pantolon",
    price: 1280,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#2d3748", "#556b2f", "#808080"],
  },
];

export const bestSellersMen: Product[] = [
  {
    id: "m1",
    title: "Erkek Premium T-Shirt",
    price: 450,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#808080", "#ffffff"],
  },
  {
    id: "m2",
    title: "Erkek Günlük Pantolon",
    price: 980,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#2d3748", "#808080", "#000000"],
  },
  {
    id: "m3",
    title: "Erkek Denim Chore Jacket",
    price: 1200,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    badge: "Yeni",
    colors: ["#2d3748", "#000000"],
  },
  {
    id: "m4",
    title: "Erkek Coastal Bomber",
    price: 1500,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    colors: ["#000000", "#2d3748", "#808080"],
  },
];

export const featuredCards = [
  {
    title: "İmza Kesim",
    description: "Premium kumaşlar ve görünmez dikişler ile ikinci bir cilt hissi.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/collection/signature",
  },
  {
    title: "Yumuşak Esneklik",
    description: "Günlük konfor için tasarlanmış, nefes alan kumaşlar.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/collection/soft-flex",
  },
  {
    title: "Active Collection",
    description: "Her rutin için tasarlanmış performans odaklı parçalar.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/collection/active",
  },
];

export const editorialTiles: Tile[] = [];

export const womensBrands: BrandItem[] = [
  {
    id: "1",
    title: "Classic White Polo",
    href: "/women/brands/classic-polo",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Gold Chain Necklace",
    href: "/women/brands/jewelry",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Plaid Jacket",
    href: "/women/brands/plaid-jacket",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop",
  },
];

export const mensBrands: BrandItem[] = [
  {
    id: "1",
    title: "Blue Sweatshirt",
    href: "/men/brands/sweatshirt",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Grey Cardigan",
    href: "/men/brands/cardigan",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Green Puffer Jacket",
    href: "/men/brands/puffer",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop",
  },
];
