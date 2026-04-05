import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildProductPath } from "@/lib/seo/productPath";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

type Props = {
  params: Promise<{
    categorySlug: string;
    colorSlug: string;
    fabricSlug: string;
  }>;
};

type LandingProduct = {
  id: string;
  slug: string | null;
  gender: string | null;
  name: string;
  price: number;
  primaryImage: string | null;
  image: string | null;
  fabricType: string | null;
  colors: { name: string }[];
};

export const revalidate = 3600;

function humanizeSlug(value: string) {
  return decodeURIComponent(value).replace(/-/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getLandingData(categorySlug: string, colorSlug: string, fabricSlug: string) {
  const colorTerm = humanizeSlug(colorSlug);
  const fabricTerm = humanizeSlug(fabricSlug);

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true, slug: true, name: true },
  });

  if (!category) {
    return null;
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: category.id,
      fabricType: { contains: fabricTerm, mode: "insensitive" },
      colors: {
        some: {
          name: { contains: colorTerm, mode: "insensitive" },
        },
      },
    },
    select: {
      id: true,
      slug: true,
      gender: true,
      name: true,
      price: true,
      primaryImage: true,
      image: true,
      fabricType: true,
      colors: {
        select: { name: true },
        take: 3,
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 48,
  });

  return {
    category,
    colorTerm,
    fabricTerm,
    products,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, colorSlug, fabricSlug } = await params;
  const data = await getLandingData(categorySlug, colorSlug, fabricSlug);

  const shortPath = `/${colorSlug}-${fabricSlug}-${categorySlug}`;
  const canonical = `${BASE_URL}${shortPath}`;
  const categoryName = data?.category.name || titleCase(humanizeSlug(categorySlug));
  const colorName = titleCase(humanizeSlug(colorSlug));
  const fabricName = titleCase(humanizeSlug(fabricSlug));

  const title = `${colorName} ${fabricName} ${categoryName} | Dark Velvet`;
  const description = `${colorName} ${fabricName} ${categoryName} modellerini Dark Velvet koleksiyonunda kesfedin. Guncel fiyat, stok ve hizli teslimat avantajlari.`;

  const shouldIndex = Boolean(data && data.products.length >= 3);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Dark Velvet",
    },
  };
}

export async function generateStaticParams() {
  const records = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { isActive: true },
      fabricType: { not: null },
      colors: { some: {} },
    },
    select: {
      category: { select: { slug: true } },
      fabricType: true,
      colors: {
        select: { name: true },
        take: 2,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 600,
  });

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const set = new Set<string>();

  for (const record of records) {
    const categorySlug = record.category?.slug;
    const fabric = record.fabricType?.trim();
    const color = record.colors?.[0]?.name?.trim();

    if (!categorySlug || !fabric || !color) {
      continue;
    }

    const colorSlug = toSlug(color);
    const fabricSlug = toSlug(fabric);

    if (!colorSlug || !fabricSlug) {
      continue;
    }

    set.add(`${categorySlug}::${colorSlug}::${fabricSlug}`);
    if (set.size >= 180) {
      break;
    }
  }

  return Array.from(set).map((item) => {
    const [categorySlug, colorSlug, fabricSlug] = item.split("::");
    return { categorySlug, colorSlug, fabricSlug };
  });
}

export default async function ProgrammaticLandingPage({ params }: Props) {
  const { categorySlug, colorSlug, fabricSlug } = await params;
  const data = await getLandingData(categorySlug, colorSlug, fabricSlug);

  if (!data) {
    return null;
  }

  const pageTitle = `${titleCase(data.colorTerm)} ${titleCase(data.fabricTerm)} ${data.category.name}`;
  const shortPath = `/${colorSlug}-${fabricSlug}-${categorySlug}`;

  const faqItems = [
    {
      q: `${pageTitle} urunleri hangi kumastan uretilir?`,
      a: `Bu sayfada listelenen urunler agirlikli olarak ${titleCase(data.fabricTerm)} kumas ozelligine sahip urunlerden olusur.`,
    },
    {
      q: `${pageTitle} siparisleri kac gunde kargoya verilir?`,
      a: "Siparisler genellikle 1-2 is gunu icinde kargoya verilir ve teslimat bolgeye gore 2-3 is gununde tamamlanir.",
    },
    {
      q: "Iade suresi kac gun?",
      a: "Teslimattan sonra 14 gun icinde iade veya degisim talebi olusturabilirsiniz.",
    },
  ];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    numberOfItems: data.products.length,
    itemListElement: data.products.map((product: LandingProduct, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}${buildProductPath({
        id: product.id,
        slug: product.slug,
        gender: product.gender,
        categorySlug: data.category.slug,
      })}`,
      name: product.name,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">{pageTitle}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {data.products.length} urun bulundu. Filtrelenmis sayfa her saat otomatik guncellenir.
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Kaynak Kutusu</h2>
        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
          <li>
            <Link href={`/category/${data.category.slug}`} className="underline underline-offset-2">
              Kategori Kaynagi: {data.category.name}
            </Link>
          </li>
          <li>
            <Link href="/contract" className="underline underline-offset-2">
              Iade ve Sozlesme Bilgisi
            </Link>
          </li>
          <li>
            <Link href={shortPath} className="underline underline-offset-2">
              Bu Sayfanin Kisa SEO URL'i
            </Link>
          </li>
        </ul>
      </div>

      <section className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-base font-semibold text-neutral-900">Sikca Sorulan Sorular</h2>
        <ul className="mt-3 space-y-3">
          {faqItems.map((item) => (
            <li key={item.q}>
              <h3 className="text-sm font-medium text-neutral-900">{item.q}</h3>
              <p className="mt-1 text-sm text-neutral-700">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.products.map((product: LandingProduct) => {
          const image = product.primaryImage || product.image || "/placeholder.jpg";
          const colorLabel = product.colors.map((c: { name: string }) => c.name).join(", ");
          const alt = `Dark Velvet ${product.name} ${colorLabel} ${product.fabricType || ""}`.trim();

          return (
            <li key={product.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <Link
                href={buildProductPath({
                  id: product.id,
                  slug: product.slug,
                  categorySlug: data.category.slug,
                })}
                className="block"
              >
                <div className="relative aspect-3/4 bg-neutral-100">
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-3">
                  <h2 className="line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</h2>
                  <p className="mt-1 text-sm text-neutral-600">{product.price.toFixed(2)} TL</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
