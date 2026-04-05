import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");
    let buffer: Buffer;

    if (contentType?.includes("application/json")) {
      const body = await req.json();
      const base64String = body.base64 || body.data;

      if (!base64String || typeof base64String !== "string") {
        return NextResponse.json({ error: "No base64 data provided" }, { status: 400 });
      }

      const base64Data = base64String.includes(",")
        ? base64String.split(",")[1]
        : base64String;

      buffer = Buffer.from(base64Data, "base64");
    } else {
      const data = await req.formData();
      const file = data.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const res = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "darkvelvet",
          resource_type: "auto",
          quality: "auto:good",
          fetch_format: "auto",
          width: 2000,
          height: 2000,
          crop: "limit",
          use_filename: true,
          unique_filename: true,
        },
        (err, result) => {
          if (err) {
            console.error("Cloudinary upload_stream error callback:", err);
            return reject(err);
          }
          if (!result) {
            console.error("Cloudinary upload_stream result is empty");
            return reject(new Error("Upload result is empty"));
          }
          resolve(result as any);
        }
      );

      uploadStream.end(buffer);
    });

    console.log("Cloudinary upload successful:", res.secure_url);
    return NextResponse.json({ url: res.secure_url });
  } catch (e: any) {
    console.error("Global upload error:", e);
    return NextResponse.json({
      error: "Cloudinary upload failed",
      details: e.message || String(e)
    }, { status: 500 });
  }
}
