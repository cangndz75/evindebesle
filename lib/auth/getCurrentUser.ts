import { getServerSession } from "next-auth"
import { prisma } from "../db"
import { authConfig } from "../auth.config"

export async function getCurrentUser() {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
    },
  })

  return user
}
