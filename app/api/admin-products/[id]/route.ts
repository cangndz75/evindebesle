import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
import { generateVariantCode, generateProductSlug } from "@/lib/slug";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { logAuditAction } from "@/lib/auditLog";


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
      brand,
      weight,
      categoryId,
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
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    // Kategori bilgisini al
    let categoryName: string | null = existingProduct.category?.name || null;
    if (categoryId && categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });
      categoryName = category?.name || null;
    }

    // İlk renk adını al
    const firstColorName = colors && colors.length > 0 ? colors[0].name : (existingProduct.colors[0]?.name || null);

    // Slug oluştur veya kullanıcının verdiği slug'ı kullan
    let finalSlug = slug;
    if (!finalSlug && name && name !== existingProduct.name) {
      // Ürün adı değiştiyse veya slug yoksa otomatik oluştur
      finalSlug = generateProductSlug(name, categoryName, firstColorName);
    } else if (!finalSlug) {
      // Slug yoksa mevcut bilgilerle oluştur
      finalSlug = generateProductSlug(
        existingProduct.name,
        categoryName,
        firstColorName
      );
    }

    // Slug kontrolü - unique olmalı
    if (finalSlug && finalSlug !== existingProduct.slug) {
      const existing = await prisma.product.findFirst({
        where: { slug: finalSlug },
      });
      if (existing) {
        // Eğer slug varsa, sonuna sayı ekle
        let counter = 1;
        const baseSlug = finalSlug;
        while (existing) {
          finalSlug = `${baseSlug}-${counter}`;
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
    if (slug !== undefined) updateData.slug = finalSlug;
    if (stockCode !== undefined) updateData.stockCode = stockCode;

    // Barcode update and unique check
    if (body.barcode !== undefined) {
      if (body.barcode && body.barcode !== existingProduct.barcode) {
        const existing = await prisma.product.findFirst({ where: { barcode: body.barcode } });
        if (existing) {
          throw new Error(`Barkod (${body.barcode}) zaten kullanımda.`);
        }
      }
      updateData.barcode = body.barcode || null;
    }

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
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (brand !== undefined) updateData.brand = brand || null;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (body.isTrackInventory !== undefined) updateData.isTrackInventory = body.isTrackInventory;
    if (body.allowBackorders !== undefined) updateData.allowBackorders = body.allowBackorders;

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

    // Renkleri güncelle
    if (colors !== undefined) {
      // Mevcut renkleri sil
      await prisma.productColor.deleteMany({
        where: { productId: id },
      });

      // Yeni renkleri ekle
      if (colors && colors.length > 0) {
        for (const c of colors) {
          // Aynı ürün için aynı renk adı kontrolü
          let existing = await prisma.productColor.findFirst({
            where: {
              productId: id,
              name: c.name,
            },
          });

          // Eğer aynı renk zaten varsa, atla
          if (existing) {
            continue;
          }

          await prisma.productColor.create({
            data: {
              productId: id,
              name: c.name,
              hexCode: c.hexCode || undefined,
              description: c.description || undefined,
              images: Array.isArray(c.images) ? JSON.stringify(c.images) : (c.images || null),
            },
          });
        }
      }
    }

    // Bedenleri güncelle
    if (sizes !== undefined) {
      // Mevcut bedenleri sil
      await prisma.productSize.deleteMany({
        where: { productId: id },
      });

      // Yeni bedenleri ekle
      if (sizes && sizes.length > 0) {
        await prisma.productSize.createMany({
          data: sizes.map((s: any) => ({
            productId: id,
            name: s.name,
            stock: parseInt(s.stock) || 0,
          })),
        });
      }
    }

    // Variantları yeniden oluştur (renk ve beden değiştiyse)
    if (colors !== undefined || sizes !== undefined) {
      // Mevcut variantları sil
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      // Yeni variantları oluştur
      const updatedColors = await prisma.productColor.findMany({
        where: { productId: id },
      });
      const updatedSizes = await prisma.productSize.findMany({
        where: { productId: id },
      });

      if (updatedColors.length > 0) {
        for (const color of updatedColors) {
          const colorData = colors?.find((c: any) => c.name === color.name);

          // Renge özel bedenler varsa onları kullan, yoksa tüm bedenleri kullan
          const colorSizes = colorData?.sizes && colorData.sizes.length > 0
            ? updatedSizes.filter((s: any) => colorData.sizes.includes(s.name))
            : updatedSizes;

          if (colorSizes.length > 0) {
            for (const size of colorSizes) {
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
      } else if (updatedSizes.length > 0) {
        // Renk yoksa, sadece beden bazlı variant oluştur
        for (const size of updatedSizes) {
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
      }
    }

    // Etiketleri güncelle
    if (tags !== undefined) {
      await prisma.productTag.deleteMany({
        where: { productId: id },
      });
      if (tags && tags.length > 0) {
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
      if (sizeOptions && sizeOptions.length > 0) {
        await prisma.productSizeOption.createMany({
          data: sizeOptions.map((so: any) => ({
            productId: id,
            name: typeof so === "string" ? so : so.name,
          })),
        });
      }
    }

    // Kombinleri güncelle
    if (combinations !== undefined) {
      await prisma.productCombination.deleteMany({
        where: { productId: id },
      });
      if (combinations && Array.isArray(combinations) && combinations.length > 0) {
        await prisma.productCombination.createMany({
          data: combinations.map((relatedProductId: any) => ({
            productId: id,
            relatedProductId: typeof relatedProductId === 'string' ? relatedProductId : (relatedProductId.relatedProductId || relatedProductId),
          })),
          skipDuplicates: true,
        });
      }
    }

    // Güncellenmiş ürünü döndür
    const updatedProduct = await prisma.product.findUnique({
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

    // Audit Log
    await logAuditAction({
      action: "PRODUCT_UPDATE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Product",
      targetId: id,
      details: {
        oldValue: existingProduct,
        newValue: updatedProduct,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/new-arrivals");
    revalidatePath("/collections");
    if (updatedProduct?.slug) {
      revalidatePath(`/products/${updatedProduct.slug}`);
      revalidatePath(`/product/${updatedProduct.slug}`);
    }
    revalidatePath(`/product/${id}`);
    return NextResponse.json(updatedProduct);

  } catch (error: any) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Ürünü sil (renk seçimi ile)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { colorIds, deleteAll } = body;

    // Ürünü ve renklerini çek
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        colors: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    // Siparişi olan ürünler silinemez
    const hasOrders = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (hasOrders > 0) {
      return NextResponse.json(
        { error: "Siparişi olan ürünler silinemez. Bunun yerine arşivleyin." },
        { status: 400 }
      );
    }

    // Audit Log Payload preparation
    const auditDetails = {
      product: product,
      deleteAll: deleteAll,
      colorIds: colorIds
    };


    // Tümünü sil veya seçilen renkleri sil
    if (deleteAll) {
      // Tüm ürünü ve ilişkili tüm verileri sil (CASCADE ile otomatik silinir)
      await prisma.product.delete({
        where: { id },
      });
    } else if (colorIds && Array.isArray(colorIds) && colorIds.length > 0) {
      // Seçilen renkleri ve ilişkili verileri sil
      for (const colorId of colorIds) {
        // Renk ile ilişkili tüm verileri sil
        await prisma.productVariant.deleteMany({
          where: { colorId },
        });
        await prisma.productImage.deleteMany({
          where: { colorId },
        });
        await prisma.productReview.deleteMany({
          where: { colorId },
        });
        await prisma.cartItem.deleteMany({
          where: { colorId },
        });
        await prisma.orderItem.deleteMany({
          where: { colorId },
        });

        // Renkleri sil
        await prisma.productColor.delete({
          where: { id: colorId },
        });
      }

      // Eğer tüm renkler silindiyse ve başka ilişkili veri yoksa ürünü de sil
      const remainingColors = await prisma.productColor.count({
        where: { productId: id },
      });

      if (remainingColors === 0) {
        const hasSizes = await prisma.productSize.count({
          where: { productId: id },
        });

        if (hasSizes === 0) {
          // Ürünü de sil
          await prisma.product.delete({
            where: { id },
          });
        }
      }
    } else {
      return NextResponse.json(
        { error: "Lütfen silinecek renkleri seçin veya tümünü sil seçeneğini işaretleyin" },
        { status: 400 }
      );
    }

    // Audit Log
    await logAuditAction({
      action: "PRODUCT_DELETE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Product",
      targetId: id,
      details: auditDetails,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/new-arrivals");
    revalidatePath("/collections");
    revalidatePath(`/product/${id}`);
    return NextResponse.json({ success: true, message: "Silme işlemi tamamlandı" });

  } catch (error: any) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
