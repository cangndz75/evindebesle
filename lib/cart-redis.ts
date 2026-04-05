import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export type RedisCartItem = {
  id: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

const CART_TTL_SECONDS = 60 * 60 * 24 * 14;

function cartKey(userId: string) {
  return `cart:user:${userId}`;
}

export function isRedisCartEnabled() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedisClient() {
  return Redis.fromEnv();
}

function sanitizeSnapshot(items: unknown): RedisCartItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: String(item.id || ""),
      productId: String(item.productId || ""),
      colorId: item.colorId ? String(item.colorId) : null,
      sizeId: item.sizeId ? String(item.sizeId) : null,
      quantity: Math.max(1, Number(item.quantity || 1)),
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString()),
    }))
    .filter((item) => item.id && item.productId);
}

export async function getRedisCartSnapshot(userId: string): Promise<RedisCartItem[]> {
  if (!isRedisCartEnabled()) return [];

  const redis = getRedisClient();
  const data = await redis.get<unknown>(cartKey(userId));
  return sanitizeSnapshot(data);
}

export async function setRedisCartSnapshot(userId: string, items: RedisCartItem[]) {
  if (!isRedisCartEnabled()) return;
  const redis = getRedisClient();
  await redis.set(cartKey(userId), items, { ex: CART_TTL_SECONDS });
}

export async function clearRedisCart(userId: string) {
  if (!isRedisCartEnabled()) return;
  const redis = getRedisClient();
  await redis.del(cartKey(userId));
}

export async function upsertRedisCartItem(userId: string, payload: {
  productId: string;
  colorId?: string | null;
  sizeId?: string | null;
  quantity: number;
}) {
  const now = new Date().toISOString();
  const items = await getRedisCartSnapshot(userId);
  const colorId = payload.colorId || null;
  const sizeId = payload.sizeId || null;

  const existing = items.find(
    (item) =>
      item.productId === payload.productId &&
      item.colorId === colorId &&
      item.sizeId === sizeId
  );

  if (existing) {
    existing.quantity = Math.max(1, existing.quantity + payload.quantity);
    existing.updatedAt = now;
    await setRedisCartSnapshot(userId, items);
    return existing.id;
  }

  const id = `rcart-${crypto.randomUUID()}`;
  items.push({
    id,
    productId: payload.productId,
    colorId,
    sizeId,
    quantity: Math.max(1, payload.quantity),
    createdAt: now,
    updatedAt: now,
  });

  await setRedisCartSnapshot(userId, items);
  return id;
}

export async function updateRedisCartItemQuantity(userId: string, itemId: string, quantity: number) {
  const items = await getRedisCartSnapshot(userId);
  const idx = items.findIndex((item) => item.id === itemId);
  if (idx < 0) return false;

  items[idx].quantity = Math.max(1, quantity);
  items[idx].updatedAt = new Date().toISOString();
  await setRedisCartSnapshot(userId, items);
  return true;
}

export async function removeRedisCartItem(userId: string, itemId: string) {
  const items = await getRedisCartSnapshot(userId);
  const next = items.filter((item) => item.id !== itemId);
  await setRedisCartSnapshot(userId, next);
}

export async function hydrateRedisCart(userId: string) {
  const snapshot = await getRedisCartSnapshot(userId);
  if (snapshot.length === 0) return [];

  const productIds = Array.from(new Set(snapshot.map((item) => item.productId)));
  const colorIds = Array.from(new Set(snapshot.map((item) => item.colorId).filter(Boolean))) as string[];
  const sizeIds = Array.from(new Set(snapshot.map((item) => item.sizeId).filter(Boolean))) as string[];

  const [products, colors, sizes] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
        slug: true,
        description: true,
        isActive: true,
        categoryId: true,
        gender: true,
      },
    }),
    colorIds.length
      ? prisma.productColor.findMany({
          where: { id: { in: colorIds } },
          select: { id: true, name: true, hexCode: true, images: true },
        })
      : Promise.resolve([]),
    sizeIds.length
      ? prisma.productSize.findMany({
          where: { id: { in: sizeIds } },
          select: { id: true, name: true, stock: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((product: any) => [product.id, product]));
  const colorMap = new Map(
    colors.map((color: any) => {
      let parsedImages: string[] = [];
      if (color.images) {
        try {
          parsedImages = typeof color.images === "string" ? JSON.parse(color.images) : color.images;
        } catch {
          parsedImages = [String(color.images)];
        }
      }
      return [color.id, { ...color, images: parsedImages }];
    })
  );
  const sizeMap = new Map(sizes.map((size: any) => [size.id, size]));

  return snapshot
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      return {
        id: item.id,
        userId,
        productId: item.productId,
        colorId: item.colorId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        product,
        color: item.colorId ? colorMap.get(item.colorId) || null : null,
        size: item.sizeId ? sizeMap.get(item.sizeId) || null : null,
      };
    })
    .filter(Boolean);
}

export async function warmRedisCartFromDatabase(userId: string) {
  if (!isRedisCartEnabled()) return;

  const items = await prisma.cartItem.findMany({
    where: { userId },
    select: { id: true, productId: true, colorId: true, sizeId: true, quantity: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const snapshot: RedisCartItem[] = items.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    colorId: item.colorId,
    sizeId: item.sizeId,
    quantity: item.quantity,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  await setRedisCartSnapshot(userId, snapshot);
}

export async function persistRedisCartToDatabase(userId: string) {
  const snapshot = await getRedisCartSnapshot(userId);
  if (snapshot.length === 0) return { persisted: 0 };

  await prisma.$transaction(async (tx: any) => {
    await tx.cartItem.deleteMany({ where: { userId } });
    await tx.cartItem.createMany({
      data: snapshot.map((item) => ({
        userId,
        productId: item.productId,
        colorId: item.colorId,
        sizeId: item.sizeId,
        quantity: item.quantity,
      })),
      skipDuplicates: true,
    });
  });

  return { persisted: snapshot.length };
}
