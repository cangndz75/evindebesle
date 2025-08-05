import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadInvoicePdf(buffer: Buffer, fileName: string) {
  return await new Promise<{ url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "raw", public_id: `invoices/${fileName}`, format: "pdf" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({ url: result.secure_url });
      }
    ).end(buffer);
  });
}
