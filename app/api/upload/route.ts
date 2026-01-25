import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    let buffer: Buffer;

    // Base64 string kontrolü (JSON body)
    if (contentType?.includes("application/json")) {
      const body = await req.json();
      const base64String = body.base64 || body.data;
      
      if (!base64String || typeof base64String !== "string") {
        return NextResponse.json({ error: "No base64 data provided" }, { status: 400 });
      }

      // Base64 string'i buffer'a çevir
      // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
      const base64Data = base64String.includes(",") 
        ? base64String.split(",")[1] 
        : base64String;
      
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // FormData (dosya yükleme)
      const data = await req.formData();
      const file = data.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const res = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: "evindebesle",
          // Optimizasyon ayarları
          quality: "auto:good", // Otomatik kalite optimizasyonu
          fetch_format: "auto", // Modern format (WebP) kullan
          width: 2000,
          height: 2000,
          crop: "limit", // Maksimum boyut sınırı
        },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result as any);
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: res.secure_url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
  }
}
