import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateVariantCode, generateProductSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const stockStatus = searchParams.get("stockStatus");
  const sortBy = searchParams.get("sortBy");
  const gender = searchParams.get("gender");
  const sizeType = searchParams.get("sizeType");
  const minStock = searchParams.get("minStock");
  const maxStock = searchParams.get("maxStock");

  const categoryId = searchParams.get("categoryId");

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { stockCode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { colors: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (gender) where.gender = gender;
  if (sizeType) where.sizeType = sizeType;

  try {
    const products = await prisma.product.findMany({
      where,
      include: {
        colors: true,
        sizes: true,
        tags: true,
        sizeOptions: true,
        category: true,
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

    // Stok ve sıralama filtreleri (JavaScript tarafında)
    let filteredProducts = products;

    // Stok durumu filtresi
    if (stockStatus && stockStatus !== "all") {
      filteredProducts = products.filter((product: any) => {
        const totalStock = (product.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        if (stockStatus === "inStock") return totalStock > 0;
        if (stockStatus === "outOfStock") return totalStock === 0;
        if (stockStatus === "lowStock") return totalStock > 0 && totalStock <= 10;
        return true;
      });
    }

    // Min/Max stok filtresi
    if (minStock || maxStock) {
      filteredProducts = filteredProducts.filter((product: any) => {
        const totalStock = (product.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        if (minStock && totalStock < parseInt(minStock)) return false;
        if (maxStock && totalStock > parseInt(maxStock)) return false;
        return true;
      });
    }

    // Sıralama
    let sortedProducts = [...filteredProducts];
    if (sortBy === "name") {
      sortedProducts.sort((a: any, b: any) => a.name.localeCompare(b.name, "tr"));
    } else if (sortBy === "stock") {
      sortedProducts.sort((a: any, b: any) => {
        const stockA = (a.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        const stockB = (b.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        return stockB - stockA;
      });
    } else if (sortBy === "newest") {
      sortedProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      sortedProducts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sortedProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      categoryId,
      brand,
      weight
    } = body;

    // Gender normalization (handle "Unisex" -> "UNISEX")
    const genderKey = gender ? gender.toUpperCase() : undefined;
    const validGenders = ["MALE", "FEMALE", "UNISEX"];
    const finalGender = validGenders.includes(genderKey) ? genderKey : undefined;

    // Kategori kontrolü
    let categoryName: string | null = null;
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });
      categoryName = category?.name || null;
    }

    // Slug oluşturma
    const firstColorName = colors && colors.length > 0 ? colors[0].name : null;
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateProductSlug(name, categoryName, firstColorName);
    }

    // Unique Slug kontrolü
    if (finalSlug) {
      const existing = await prisma.product.findFirst({ where: { slug: finalSlug } });
      if (existing) {
        let counter = 1;
        while (existing) {
          finalSlug = `${slug || generateProductSlug(name, categoryName, firstColorName)}-${counter}`;
          const check = await prisma.product.findFirst({ where: { slug: finalSlug } });
          if (!check) break;
          counter++;
        }
      }
    }

    // Unique StockCode kontrolü
    let finalStockCode = stockCode;
    if (finalStockCode) {
      const existing = await prisma.product.findFirst({ where: { stockCode: finalStockCode } });
      if (existing) {
        let counter = 1;
        while (existing) {
          finalStockCode = `${stockCode}-${counter}`;
          const check = await prisma.product.findFirst({ where: { stockCode: finalStockCode } });
          if (!check) break;
          counter++;
        }
      }
    }

    // 1. Ürünü ve doğrudan ilişkili verileri (Sizes, Tags, SizeOptions) oluştur
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug || undefined,
        stockCode: finalStockCode || undefined,
        description: description || undefined,
        // Frontend'den gelen detailText artık temizlenmiş ve görselleri URL'e çevrilmiş durumda
        detailText: detailText || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        image: image || undefined,
        primaryImage: primaryImage || image || undefined,
        secondaryImage: secondaryImage || undefined,
        gender: finalGender,
        sizeType: sizeType || undefined,
        fabricType: fabricType || undefined,
        categoryId: categoryId || undefined,
        brand: brand || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        isActive: isActive !== undefined ? isActive : true,

        // Bedenler (Eğer sizes varsa sizes'dan, yoksa sizeOptions'tan oluştur)
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
                stock: 0,
              })),
            }
            : undefined,

        tags: tags
          ? {
            create: tags.map((t: any) => ({
              name: typeof t === "string" ? t : t.name,
            })),
          }
          : undefined,

        sizeOptions: sizeOptions
          ? {
            create: sizeOptions.map((so: any) => ({
              name: typeof so === "string" ? so : so.name,
            })),
          }
          : undefined,
      },
    });

    // 2. ProductImage kayıtlarını oluştur (Primary ve Secondary)
    let imageOrder = 0;

    // Primary Image
    if (primaryImage || image) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: primaryImage || image,
          isPrimary: true,
          isSecondary: false,
          order: imageOrder++,
          alt: `${name} - Ana Görsel`,
        },
      });
    }

    // Secondary Image
    if (secondaryImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: secondaryImage,
          isPrimary: false,
          isSecondary: true,
          order: imageOrder++,
          alt: `${name} - İkinci Görsel`,
        },
      });
    }

    // 3. Renkleri Oluştur
    // Frontend artık Base64 değil, Cloudinary URL'leri gönderiyor.
    if (colors && colors.length > 0) {
      for (const c of colors) {
        const existing = await prisma.productColor.findFirst({
          where: { productId: product.id, name: c.name },
        });

        let colorRecord;
        if (!existing) {
          colorRecord = await prisma.productColor.create({
            data: {
              productId: product.id,
              name: c.name,
              hexCode: c.hexCode || undefined,
              description: c.description || undefined,
              // Gelen images array'ini veritabanına JSON string olarak kaydediyoruz
              images: Array.isArray(c.images) ? JSON.stringify(c.images) : (c.images || null),
            },
          });
        } else {
          colorRecord = existing;
        }

        // Renk için ProductImage kayıtları oluştur
        if (c.images && Array.isArray(c.images) && c.images.length > 0) {
          for (let i = 0; i < c.images.length; i++) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                colorId: colorRecord.id,
                url: c.images[i],
                isPrimary: false,
                isSecondary: false,
                order: imageOrder++,
                alt: `${name} - ${c.name} ${i + 1}`,
              },
            });
          }
        }
      }
    }

    // 3. Varyantları (Stok Kartlarını) Oluştur
    if (colors && colors.length > 0) {
      const createdColors = await prisma.productColor.findMany({ where: { productId: product.id } });
      const createdSizes = await prisma.productSize.findMany({ where: { productId: product.id } });

      for (const color of createdColors) {
        const colorData = colors.find((c: any) => c.name === color.name);

        // Eğer bu renk için özel bedenler seçilmişse sadece onları kullan, yoksa hepsini
        const colorSizes = colorData?.sizes && colorData.sizes.length > 0
          ? createdSizes.filter((s: any) => colorData.sizes.includes(s.name))
          : createdSizes;

        if (colorSizes.length > 0) {
          for (const size of colorSizes) {
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
          // Beden yoksa sadece renk bazlı variant
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

    // 4. Renk Yoksa Sadece Beden Bazlı Varyantlar
    if ((!colors || colors.length === 0) && sizes && sizes.length > 0) {
      const createdSizes = await prisma.productSize.findMany({ where: { productId: product.id } });
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

    // 5. Kombinleri Oluştur
    if (combinations && Array.isArray(combinations) && combinations.length > 0) {
      await prisma.productCombination.createMany({
        data: combinations.map((relatedProductId: any) => ({
          productId: product.id,
          relatedProductId: typeof relatedProductId === 'string' ? relatedProductId : (relatedProductId.relatedProductId || relatedProductId),
        })),
        skipDuplicates: true,
      });
    }

    // Sonuç Döndür
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
