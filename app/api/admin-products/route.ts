import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateVariantCode } from "@/lib/slug";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const stockStatus = searchParams.get("stockStatus"); // "all", "inStock", "outOfStock", "lowStock"
  const sortBy = searchParams.get("sortBy"); // "name", "stock", "newest", "oldest"
  const gender = searchParams.get("gender"); // "MALE", "FEMALE", "UNISEX"
  const sizeType = searchParams.get("sizeType"); // "LETTER", "NUMBER"
  const minStock = searchParams.get("minStock");
  const maxStock = searchParams.get("maxStock");

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { stockCode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (gender) {
    where.gender = gender;
  }

  if (sizeType) {
    where.sizeType = sizeType;
  }

  try {
    const products = await prisma.product.findMany({
      where,
      include: {
        colors: true,
        sizes: true,
        tags: true,
        sizeOptions: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        combinations: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        reviews: {
          where: { isApproved: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Stok durumuna göre filtreleme
    let filteredProducts = products;
    if (stockStatus && stockStatus !== "all") {
      filteredProducts = products.filter((product) => {
        const totalStock = (product.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
        
        if (stockStatus === "inStock") {
          return totalStock > 0;
        } else if (stockStatus === "outOfStock") {
          return totalStock === 0;
        } else if (stockStatus === "lowStock") {
          return totalStock > 0 && totalStock <= 10;
        }
        return true;
      });
    }

    // Stok aralığına göre filtreleme
    if (minStock || maxStock) {
      filteredProducts = filteredProducts.filter((product) => {
        const totalStock = (product.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
        if (minStock && totalStock < parseInt(minStock)) return false;
        if (maxStock && totalStock > parseInt(maxStock)) return false;
        return true;
      });
    }

    // Sıralama
    let sortedProducts = [...filteredProducts];
    if (sortBy === "name") {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    } else if (sortBy === "stock") {
      sortedProducts.sort((a, b) => {
        const stockA = (a.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
        const stockB = (b.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
        return stockB - stockA;
      });
    } else if (sortBy === "newest") {
      sortedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      sortedProducts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Varsayılan: en yeni
      sortedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json(sortedProducts);
  } catch (error: any) {
    console.error("Ürünler yüklenirken hata:", error);
    return NextResponse.json(
      { error: error.message || "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } = body;

    // Slug kontrolü - unique olmalı
    let finalSlug = slug;
    if (finalSlug) {
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

    // StockCode kontrolü - unique olmalı
    let finalStockCode = stockCode;
    if (finalStockCode) {
      const existing = await prisma.product.findFirst({
        where: { stockCode: finalStockCode },
      });
      if (existing) {
        // Eğer stockCode varsa, sonuna sayı ekle
        let counter = 1;
        while (existing) {
          finalStockCode = `${stockCode}-${counter}`;
          const check = await prisma.product.findFirst({
            where: { stockCode: finalStockCode },
          });
          if (!check) break;
          counter++;
        }
      }
    }

    // Ürünü oluştur
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug || undefined,
        stockCode: finalStockCode || undefined,
        description: description || undefined,
        detailText: detailText || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        image: image || undefined,
        primaryImage: primaryImage || image || undefined,
        secondaryImage: secondaryImage || undefined,
        gender: gender || undefined,
        sizeType: sizeType || undefined,
        fabricType: fabricType || undefined,
        isActive: isActive !== undefined ? isActive : true,
        // Renkler
        colors: colors
          ? {
              create: colors.map((c: any) => ({
                name: c.name,
                hexCode: c.hexCode || undefined,
                images: c.images || [],
              })),
            }
          : undefined,
        // Bedenler - eğer sizes yoksa ama sizeOptions varsa, sizeOptions'tan ProductSize oluştur
        sizes: sizes && sizes.length > 0
          ? {
              create: sizes.map((s: any) => ({
                name: s.name,
                stock: parseInt(s.stock) || 0,
              })),
            }
          : sizeOptions && sizeOptions.length > 0
          ? {
              create: sizeOptions.map((so: any) => ({
                name: typeof so === "string" ? so : so.name,
                stock: 0, // sizeOptions'tan oluşturulanlar için varsayılan stok 0
              })),
            }
          : undefined,
        // Etiketler
        tags: tags
          ? {
              create: tags.map((t: any) => ({
                name: typeof t === "string" ? t : t.name,
              })),
            }
          : undefined,
        // Beden seçenekleri
        sizeOptions: sizeOptions
          ? {
              create: sizeOptions.map((so: any) => ({
                name: typeof so === "string" ? so : so.name,
              })),
            }
          : undefined,
      },
    });

    // Her renk için her beden için variant oluştur
    if (colors && colors.length > 0) {
      const createdColors = await prisma.productColor.findMany({
        where: { productId: product.id },
      });
      const createdSizes = await prisma.productSize.findMany({
        where: { productId: product.id },
      });

      // Renk ve beden kombinasyonları için variant oluştur
      for (const color of createdColors) {
        const colorData = colors.find((c: any) => c.name === color.name);
        
        // Eğer bedenler varsa, her beden için variant oluştur
        if (createdSizes.length > 0) {
          for (const size of createdSizes) {
            const variantCode = generateVariantCode();
            const sizeStock = colorData?.sizeStocks?.[size.name] || 0;
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                colorId: color.id,
                sizeId: size.id,
                variantCode,
                price: colorData?.price || undefined,
                stock: sizeStock,
              },
            });
          }
        } else {
          // Beden yoksa, sadece renk için variant oluştur
          const variantCode = generateVariantCode();
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              colorId: color.id,
              variantCode,
              price: colorData?.price || undefined,
              stock: 0,
            },
          });
        }
      }
    }
    
    // Ana ürün için beden bazlı variant oluştur (renk yoksa)
    if ((!colors || colors.length === 0) && sizes && sizes.length > 0) {
      const createdSizes = await prisma.productSize.findMany({
        where: { productId: product.id },
      });

      for (const size of createdSizes) {
        const variantCode = generateVariantCode();
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeId: size.id,
            variantCode,
            stock: size.stock || 0,
          },
        });
      }
    }

    // Ürün kombinleri
    if (combinations && Array.isArray(combinations) && combinations.length > 0) {
      await prisma.productCombination.createMany({
        data: combinations.map((relatedProductId: any) => ({
          productId: product.id,
          relatedProductId: typeof relatedProductId === 'string' ? relatedProductId : (relatedProductId.relatedProductId || relatedProductId),
        })),
        skipDuplicates: true,
      });
    }

    // Tüm ilişkileri dahil ederek döndür
    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        colors: true,
        sizes: true,
        tags: true,
        sizeOptions: true,
        combinations: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(productWithRelations);
  } catch (error: any) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
