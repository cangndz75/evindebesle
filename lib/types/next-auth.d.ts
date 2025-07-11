import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    isAdmin: boolean
  }
}
