import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateVariantCode } from "@/lib/slug";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// GET: Ürün detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        colors: true,
        sizes: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        combinations: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      slug,
      stockCode,
      description,
      detailText,
      price,
      originalPrice,
      image,
      primaryImage,
      secondaryImage,
      gender,
      sizeType,
      fabricType,
      isActive,
      colors,
      sizes,
      tags,
      sizeOptions,
      combinations,
      metaTitle,
      metaDescription,
      canonicalUrl,
    } = body;

    // Önce mevcut ürünü al
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        colors: true,
        sizes: true,
        tags: true,
        sizeOptions: true,
        combinations: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    // Slug kontrolü - unique olmalı
    let finalSlug = slug;
    if (finalSlug && finalSlug !== existingProduct.slug) {
      const existing = await prisma.product.findFirst({
        where: { slug: finalSlug },
      });
      if (existing) {
        // Eğer slug varsa, sonuna sayı ekle
        let counter = 1;
        while (existing) {
          finalSlug = `${slug}-${counter}`;
          const check = await prisma.product.findFirst({
            where: { slug: finalSlug },
          });
          if (!check) break;
          counter++;
        }
      }
    }

    // Temel alanları güncelle
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = finalSlug;
    if (stockCode !== undefined) updateData.stockCode = stockCode;
    if (description !== undefined) updateData.description = description;
    if (detailText !== undefined) updateData.detailText = detailText;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (image !== undefined) updateData.image = image;
    if (primaryImage !== undefined) updateData.primaryImage = primaryImage;
    if (secondaryImage !== undefined) updateData.secondaryImage = secondaryImage;
    if (gender !== undefined) updateData.gender = gender || null;
    if (sizeType !== undefined) updateData.sizeType = sizeType || null;
    if (fabricType !== undefined) updateData.fabricType = fabricType;
    if (isActive !== undefined) updateData.isActive = isActive;

    // SEO alanları (şimdilik JSON olarak saklanabilir veya schema'ya eklenebilir)
    // TODO: Schema'ya metaTitle, metaDescription, canonicalUrl alanları eklendiğinde burayı güncelle

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        colors: true,
        sizes: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        combinations: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
