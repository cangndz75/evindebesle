import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ isAdmin: user?.isAdmin })
}
