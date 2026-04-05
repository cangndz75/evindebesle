import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(price);
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      primaryImage: true,
      secondaryImage: true,
      image: true,
      category: { select: { name: true } },
    },
  });

  const fallback = `${BASE_URL}/og-image.jpg`;

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(120deg, #18181b 0%, #27272a 100%)",
            color: "#f4f4f5",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          Dark Velvet
        </div>
      ),
      size
    );
  }

  const imageUrl = product.primaryImage || product.secondaryImage || product.image || fallback;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            width: "58%",
            height: "100%",
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            width: "42%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 46px",
            background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                fontSize: 30,
                opacity: 0.8,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Dark Velvet
            </div>
            <div
              style={{
                fontSize: 54,
                lineHeight: 1.06,
                fontWeight: 800,
                letterSpacing: -1.5,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {product.name}
            </div>
            <div
              style={{
                fontSize: 26,
                opacity: 0.8,
              }}
            >
              {product.category?.name || "Premium Koleksiyon"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              {formatPrice(product.price)}
            </div>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                background: "#f9fafb",
                color: "#111827",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Satin Al
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
