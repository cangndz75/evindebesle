export const CLOUDINARY_FOLDER = "appointment_uploads";

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;

export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/**
 * Transforms a standard Cloudinary URL to include optimization parameters.
 * e.g. f_auto (auto format), q_auto (auto quality)
 */
export function getOptimizedCloudinaryUrl(url: string | null | undefined, width?: number, height?: number): string {
    if (!url) return "";
    if (!url.includes("cloudinary.com")) return url;

    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    let transformations = "f_auto,q_auto";
    if (width) transformations += `,w_${width}`;
    if (height) transformations += `,h_${height},c_fill`; // Aspect ratio crop

    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}

/**
 * Generates a low-quality blur placeholder URL for Cloudinary images.
 */
export function getBlurPlaceholderUrl(url: string | null | undefined): string {
    if (!url) return "";
    if (!url.includes("cloudinary.com")) return url;

    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    return `${parts[0]}/upload/w_40,f_auto,q_10,e_blur:1000/${parts[1]}`;
}
