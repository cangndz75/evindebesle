import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export default async function HomePage() {
  const session = await getServerSession(authConfig)

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (user?.isAdmin) {
      redirect("/dashboard")
    }
  }

  redirect("/home")

  return null // ya da <div></div> olur, önemli değil.
}
