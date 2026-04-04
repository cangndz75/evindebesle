import "server-only";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function withAuth<T>(handler: (ctx: { userId: string; session: any }) => Promise<T>) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return handler({ userId: session.user.id, session });
}

export async function withAdmin<T>(handler: (ctx: { userId: string; session: any }) => Promise<T>) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id || !session.user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return handler({ userId: session.user.id, session });
}
