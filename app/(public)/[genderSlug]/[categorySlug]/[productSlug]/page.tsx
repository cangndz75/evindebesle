import { prisma } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import ProductPage, { generateMetadata as generateLegacyMetadata } from "@/app/(public)/product/[id]/page";
import { buildProductPath, normalizeGenderSlug } from "@/lib/seo/productPath";

export const revalidate = 3600;

type RouteProps = {
  params: Promise<{
    genderSlug: string;
    categorySlug: string;
    productSlug: string;
  }>;
};

export async function generateMetadata({ params }: RouteProps) {
  const { productSlug } = await params;
  return generateLegacyMetadata({ params: Promise.resolve({ id: productSlug }) });
}

export default async function HierarchicalProductPage({ params }: RouteProps) {
  const { genderSlug, categorySlug, productSlug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: productSlug }, { id: productSlug }],
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      gender: true,
      category: {
        select: { slug: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const canonicalPath = buildProductPath({
    id: product.id,
    slug: product.slug,
    gender: product.gender,
    categorySlug: product.category?.slug,
  });

  const expectedGender = normalizeGenderSlug(product.gender);
  const expectedCategory = product.category?.slug || "urunler";
  const expectedSlug = product.slug || product.id;

  if (
    genderSlug !== expectedGender ||
    categorySlug !== expectedCategory ||
    productSlug !== expectedSlug
  ) {
    permanentRedirect(canonicalPath);
  }

  return ProductPage({ params: Promise.resolve({ id: productSlug }), skipRedirect: true });
}
