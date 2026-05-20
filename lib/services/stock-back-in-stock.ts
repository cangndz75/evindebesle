import { prisma } from "@/lib/db";
import { resend, resendFromAddress } from "@/lib/resend";
import { generateBackInStockEmailHtml } from "@/lib/email/templates/back-in-stock-template";

export class StockNotificationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function resolveNotificationVariantId(
  productId: string,
  opts: { colorId?: string | null; sizeId?: string | null }
): Promise<string | null> {
  if (!opts.colorId && !opts.sizeId) return null;

  if (opts.colorId && opts.sizeId) {
    const exact = await prisma.productVariant.findFirst({
      where: { productId, colorId: opts.colorId, sizeId: opts.sizeId },
      select: { id: true },
    });
    if (exact) return exact.id;
  }

  if (opts.colorId) {
    const colorOnly = await prisma.productVariant.findFirst({
      where: { productId, colorId: opts.colorId, sizeId: null },
      select: { id: true },
    });
    if (colorOnly) return colorOnly.id;
  }

  return null;
}

export async function subscribeStockNotification(input: {
  productId: string;
  email: string;
  variantId?: string | null;
  userId?: string | null;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new StockNotificationError("Geçerli bir e-posta adresi giriniz.", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new StockNotificationError("Ürün bulunamadı.", 404);
  }

  const variantId = input.variantId ?? null;

  const existing = await prisma.stockNotification.findFirst({
    where: {
      productId: input.productId,
      email: normalizedEmail,
      variantId,
      isNotified: false,
    },
  });

  if (existing) {
    return { alreadySubscribed: true, message: "Bu ürün için zaten bildirim kaydınız var." };
  }

  await prisma.stockNotification.create({
    data: {
      productId: input.productId,
      email: normalizedEmail,
      variantId,
      userId: input.userId ?? null,
    },
  });

  return {
    alreadySubscribed: false,
    message: "Stoğa girince size haber vereceğiz.",
  };
}

export async function processBackInStockNotifications(params: {
  productId: string;
  variantId?: string | null;
  previousStock: number;
  newStock: number;
}) {
  if (params.previousStock > 0 || params.newStock <= 0) return { sent: 0 };

  const product = await prisma.product.findFirst({
    where: { id: params.productId },
    select: {
      id: true,
      name: true,
      slug: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  });

  if (!product) return { sent: 0 };

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.FRONTEND_BASE_URL ||
    "https://darkvelvet.com";
  const productPath = product.slug
    ? `/products/${product.slug}`
    : `/product/${product.id}`;
  const productUrl = `${baseUrl.replace(/\/$/, "")}${productPath}`;
  const imageUrl = product.images[0]?.url ?? null;

  const waitlist = await prisma.stockNotification.findMany({
    where: {
      productId: params.productId,
      isNotified: false,
      OR: params.variantId
        ? [{ variantId: params.variantId }, { variantId: null }]
        : [{ variantId: null }],
    },
  });

  if (waitlist.length === 0) return { sent: 0 };

  let sent = 0;

  for (const sub of waitlist) {
    const { error } = await resend.emails.send({
      from: resendFromAddress(),
      to: [sub.email],
      subject: `Beklediğin parça stoklara girdi — ${product.name}`,
      html: generateBackInStockEmailHtml({
        productName: product.name,
        productUrl,
        imageUrl,
      }),
    });

    if (!error) {
      await prisma.stockNotification.update({
        where: { id: sub.id },
        data: { isNotified: true },
      });
      sent++;
    } else {
      console.error("[BACK_IN_STOCK_EMAIL]", error, sub.id);
    }
  }

  return { sent };
}
