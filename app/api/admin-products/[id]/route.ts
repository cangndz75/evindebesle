import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateVariantCode } from "@/lib/slug";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      slug,
      stockCode,
      description,
      detailText,
      price,
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
    if (image !== undefined) updateData.image = image;
    if (primaryImage !== undefined) updateData.primaryImage = primaryImage;
    if (secondaryImage !== undefined) updateData.secondaryImage = secondaryImage;
    if (gender !== undefined) updateData.gender = gender;
    if (sizeType !== undefined) updateData.sizeType = sizeType;
    if (fabricType !== undefined) updateData.fabricType = fabricType;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Renkleri güncelle
    if (colors !== undefined) {
      // Mevcut variant'ları sil (renkler silinmeden önce)
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
      
      // Mevcut renkleri sil
      await prisma.productColor.deleteMany({
        where: { productId: id },
      });
      
      // Yeni renkleri ekle
      if (colors.length > 0) {
        await prisma.productColor.createMany({
          data: colors.map((c: any) => ({
            productId: id,
            name: c.name,
            hexCode: c.hexCode || undefined,
            images: c.images || [],
          })),
        });
        
        // Yeni renkler için variant oluştur
        const createdColors = await prisma.productColor.findMany({
          where: { productId: id },
        });
        const createdSizes = await prisma.productSize.findMany({
          where: { productId: id },
        });

        // Her renk için her beden için variant oluştur
        for (const color of createdColors) {
          const colorData = colors.find((c: any) => c.name === color.name);
          
          if (createdSizes.length > 0) {
            for (const size of createdSizes) {
              const variantCode = generateVariantCode();
              const sizeStock = colorData?.sizeStocks?.[size.name] || 0;
              await prisma.productVariant.create({
                data: {
                  productId: id,
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
                productId: id,
                colorId: color.id,
                variantCode,
                price: colorData?.price || undefined,
                stock: 0,
              },
            });
          }
        }
      }
    }

    // Bedenleri güncelle
    if (sizes !== undefined) {
      // Mevcut variant'ları sil (bedenler silinmeden önce)
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
      
      await prisma.productSize.deleteMany({
        where: { productId: id },
      });
      if (sizes.length > 0) {
        await prisma.productSize.createMany({
          data: sizes.map((s: any) => ({
            productId: id,
            name: s.name,
            stock: parseInt(s.stock) || 0,
          })),
        });
        
        // Ana ürün için beden bazlı variant oluştur (renk yoksa)
        const createdSizes = await prisma.productSize.findMany({
          where: { productId: id },
        });
        const existingColors = await prisma.productColor.findMany({
          where: { productId: id },
        });

        if (existingColors.length === 0) {
          // Renk yoksa, sadece bedenler için variant oluştur
          for (const size of createdSizes) {
            const variantCode = generateVariantCode();
            await prisma.productVariant.create({
              data: {
                productId: id,
                sizeId: size.id,
                variantCode,
                stock: size.stock || 0,
              },
            });
          }
        } else {
          // Renkler varsa, her renk için her beden için variant oluştur
          const colorDataMap = (colors || []).reduce((acc: any, c: any) => {
            acc[c.name] = c;
            return acc;
          }, {});
          
          for (const color of existingColors) {
            const colorData = colorDataMap[color.name];
            for (const size of createdSizes) {
              const variantCode = generateVariantCode();
              const sizeStock = colorData?.sizeStocks?.[size.name] || 0;
              await prisma.productVariant.create({
                data: {
                  productId: id,
                  colorId: color.id,
                  sizeId: size.id,
                  variantCode,
                  price: colorData?.price || undefined,
                  stock: sizeStock,
                },
              });
            }
          }
        }
      }
    }

    // Etiketleri güncelle
    if (tags !== undefined) {
      await prisma.productTag.deleteMany({
        where: { productId: id },
      });
      if (tags.length > 0) {
        await prisma.productTag.createMany({
          data: tags.map((t: any) => ({
            productId: id,
            name: typeof t === "string" ? t : t.name,
          })),
        });
      }
    }

    // Beden seçeneklerini güncelle
    if (sizeOptions !== undefined) {
      await prisma.productSizeOption.deleteMany({
        where: { productId: id },
      });
      if (sizeOptions.length > 0) {
        await prisma.productSizeOption.createMany({
          data: sizeOptions.map((so: any) => ({
            productId: id,
            name: typeof so === "string" ? so : so.name,
          })),
        });
      }
    }

    // Ürün kombinlerini güncelle
    if (combinations !== undefined) {
      await prisma.productCombination.deleteMany({
        where: { productId: id },
      });
      if (combinations.length > 0) {
        await prisma.productCombination.createMany({
          data: combinations.map((relatedProductId: string) => ({
            productId: id,
            relatedProductId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Ürünü güncelle
    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
