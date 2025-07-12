import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  return NextResponse.json({
    url: URL.createObjectURL(file),
  })
}
