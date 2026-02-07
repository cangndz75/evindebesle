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
      barcode,
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

    // Unique Barcode kontrolü
    let finalBarcode = barcode;
    if (finalBarcode) {
      const existing = await prisma.product.findFirst({ where: { barcode: finalBarcode } });
      if (existing) {
        throw new Error(`Barkod (${finalBarcode}) zaten kullanımda.`);
      }
    }

    // Gender normalization (handle "Unisex" -> "UNISEX")
    const genderKey = gender ? gender.toUpperCase() : undefined;
    const validGenders = ["MALE", "FEMALE", "UNISEX"];
    const finalGender = validGenders.includes(genderKey) ? genderKey : undefined;

    // SizeType normalization (handle "letter" -> "LETTER")
    const sizeTypeKey = sizeType ? sizeType.toUpperCase() : undefined;
    // Note: If 'cup' is sent but not in enum, it will fail unless we add it or filter it. 
    // Assuming enum is LETTER, NUMBER for now based on error.
    const validSizeTypes = ["LETTER", "NUMBER", "CUP"];
    const finalSizeType = validSizeTypes.includes(sizeTypeKey) ? sizeTypeKey : undefined;

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
        sizeType: finalSizeType,
        fabricType: fabricType || undefined,
        categoryId: categoryId || undefined,
        brand: brand || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        isActive: isActive !== undefined ? isActive : true,
        isTrackInventory: body.isTrackInventory ?? true,
        allowBackorders: body.allowBackorders ?? false,

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



    // 2. ProductImage kayıtlarını toplu oluştur (Primary ve Secondary)
    const productImagesToCreate: any[] = [];
    let imageOrder = 0;

    if (primaryImage || image) {
      productImagesToCreate.push({
        productId: product.id,
        url: primaryImage || image,
        isPrimary: true,
        isSecondary: false,
        order: imageOrder++,
        alt: `${name} - Ana Görsel`,
      });
    }

    if (secondaryImage) {
      productImagesToCreate.push({
        productId: product.id,
        url: secondaryImage,
        isPrimary: false,
        isSecondary: true,
        order: imageOrder++,
        alt: `${name} - İkinci Görsel`,
      });
    }

    // 3. Renkleri toplu oluştur
    if (colors && colors.length > 0) {
      const colorData = colors.map((c: any) => ({
        productId: product.id,
        name: c.name,
        hexCode: c.hexCode || null,
        description: c.description || null,
        images: Array.isArray(c.images) ? JSON.stringify(c.images) : (c.images || null),
      }));

      await prisma.productColor.createMany({
        data: colorData,
        skipDuplicates: true,
      });

      // Renk görsellerini ekle
      const createdColors = await prisma.productColor.findMany({ where: { productId: product.id } });

      for (const color of createdColors) {
        const originalColor = colors.find((c: any) => c.name === color.name);
        if (originalColor?.images && Array.isArray(originalColor.images)) {
          for (const imgUrl of originalColor.images) {
            productImagesToCreate.push({
              productId: product.id,
              colorId: color.id,
              url: imgUrl,
              isPrimary: false,
              isSecondary: false,
              order: imageOrder++,
              alt: `${name} - ${color.name}`,
            });
          }
        }
      }
    }

    // Tüm görselleri toplu oluştur
    if (productImagesToCreate.length > 0) {
      await prisma.productImage.createMany({
        data: productImagesToCreate,
      });
    }

    // 4. Varyantları toplu oluştur
    const variantsToCreate: any[] = [];

    if (colors && colors.length > 0) {
      const createdColors = await prisma.productColor.findMany({ where: { productId: product.id } });
      const createdSizes = await prisma.productSize.findMany({ where: { productId: product.id } });

      for (const color of createdColors) {
        const colorData = colors.find((c: any) => c.name === color.name);
        const colorSizes = colorData?.sizes && colorData.sizes.length > 0
          ? createdSizes.filter((s: any) => colorData.sizes.includes(s.name))
          : createdSizes;

        if (colorSizes.length > 0) {
          for (const size of colorSizes) {
            const variantCode = generateVariantCode();
            const sizeStock = colorData?.sizeStocks?.[size.name] || 0;
            variantsToCreate.push({
              productId: product.id,
              colorId: color.id,
              sizeId: size.id,
              variantCode,
              price: colorData?.price || null,
              stock: sizeStock,
            });
          }
        } else {
          const variantCode = generateVariantCode();
          variantsToCreate.push({
            productId: product.id,
            colorId: color.id,
            variantCode,
            price: colorData?.price || null,
            stock: 0,
          });
        }
      }
    }

    // 5. Renk yoksa sadece beden bazlı varyantlar
    if ((!colors || colors.length === 0) && sizes && sizes.length > 0) {
      const createdSizes = await prisma.productSize.findMany({ where: { productId: product.id } });
      for (const size of createdSizes) {
        const variantCode = generateVariantCode();
        variantsToCreate.push({
          productId: product.id,
          sizeId: size.id,
          variantCode,
          stock: size.stock || 0,
        });
      }
    }

    // Tüm varyantları toplu oluştur
    if (variantsToCreate.length > 0) {
      await prisma.productVariant.createMany({
        data: variantsToCreate,
        skipDuplicates: true,
      });
    }

    // 6. Kombinleri Oluştur
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
