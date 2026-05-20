import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import {
  checkUserRateLimit,
  rateLimitDenyResponse,
  RateLimits,
} from "@/lib/rateLimit";
import {
  detectReviewImageMime,
  REVIEW_MAX_FILE_SIZE,
} from "@/lib/security/review-image";

export const dynamic = "force-dynamic";

const MAX_IMAGES_PER_REQUEST = 1;

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function stripExifAndNormalize(buffer: Buffer, mime: NonNullable<ReturnType<typeof detectReviewImageMime>>) {
  const pipeline = sharp(buffer, { failOn: "error" }).rotate();

  if (mime === "image/jpeg") {
    return pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  }
  if (mime === "image/png") {
    return pipeline.png({ compressionLevel: 9 }).toBuffer();
  }
  return pipeline.webp({ quality: 85 }).toBuffer();
}

function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string,
  mime: NonNullable<ReturnType<typeof detectReviewImageMime>>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        format: mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg",
        quality: "auto:good",
        width: 1600,
        height: 1600,
        crop: "limit",
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error("Upload result is empty"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  configureCloudinary();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkUserRateLimit(session.user.id, "reviewUpload");
    const rateLimited = rateLimitDenyResponse(
      rateLimitResult,
      RateLimits.reviewUpload,
      "Saatlik yorum görseli yükleme limitine ulaştınız (en fazla 10 görsel/saat)."
    );
    if (rateLimited) {
      return new NextResponse(rateLimited.body, {
        status: rateLimited.status,
        statusText: rateLimited.statusText,
        headers: rateLimited.headers,
      });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const productIdRaw = formData.get("productId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    let productFolder = "general";
    if (typeof productIdRaw === "string" && productIdRaw.trim()) {
      const productId = productIdRaw.trim();
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        return NextResponse.json({ error: "Geçersiz ürün." }, { status: 400 });
      }
      productFolder = product.id;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Boş dosya." }, { status: 400 });
    }

    if (buffer.length > REVIEW_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 5 MB sınırını aşıyor." },
        { status: 400 }
      );
    }

    const detectedMime = detectReviewImageMime(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        {
          error:
            "Geçersiz dosya türü. Yalnızca JPEG, PNG ve WebP kabul edilir (SVG dahil değil).",
        },
        { status: 400 }
      );
    }

    if (file.type && file.type !== detectedMime && file.type !== "image/jpg") {
      return NextResponse.json(
        { error: "Dosya içeriği ile bildirilen tür uyuşmuyor." },
        { status: 400 }
      );
    }

    let processed: Buffer;
    try {
      processed = await stripExifAndNormalize(buffer, detectedMime);
    } catch (stripErr) {
      console.error("Review image sharp processing failed:", stripErr);
      return NextResponse.json({ error: "Görsel işlenemedi." }, { status: 400 });
    }

    if (processed.length > REVIEW_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "İşlenmiş görsel 5 MB sınırını aşıyor." },
        { status: 400 }
      );
    }

    const safeId = randomUUID();
    const folder = `darkvelvet/reviews/${productFolder}`;

    const url = await uploadToCloudinary(processed, folder, safeId, detectedMime);

    return NextResponse.json({
      success: true,
      url,
      message: "Yorum görseli yüklendi.",
      meta: { maxPerReview: MAX_IMAGES_PER_REQUEST },
    });
  } catch (error) {
    console.error("Review file upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
