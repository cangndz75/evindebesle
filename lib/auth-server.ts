import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function createSession(user: { id: string }) {
  const token = nanoid();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 gün

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  (await cookies()).set("session-token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { token };
}
