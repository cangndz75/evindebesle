import { NextRequest, NextResponse } from "next/server";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  // Config'i her istekte kontrol et/ayarla (env'lerin yüklendiğinden emin olmak için)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

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
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "evindebesle",
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
