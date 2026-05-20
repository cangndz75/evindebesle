const getCloudinaryConfig = () => {
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) cloudName = "dlahfchej";
    if (!uploadPreset) uploadPreset = "appointment_uploads";

    return {
        cloudName,
        uploadPreset,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    };
};

export async function uploadBase64ToCloudinary(base64String: string): Promise<string | null> {
    const config = getCloudinaryConfig();

    try {
        const formData = new FormData();
        formData.append("file", base64String);
        formData.append("upload_preset", config.uploadPreset);

        const res = await fetch(config.uploadUrl, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Cloudinary Error Details:", data);
            throw new Error(data.error?.message || "Upload failed");
        }

        return data.secure_url || null;
    } catch (error: any) {
        console.error("Base64 upload error:", error);
        return null;
    }
}

/**
 * Yorum görselleri — sunucu tarafı doğrulama, EXIF temizleme, userId rate limit.
 */
export async function uploadReviewImage(file: File, productId?: string): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append("file", file);
        if (productId) formData.append("productId", productId);

        const res = await fetch("/api/upload/review", {
            method: "POST",
            body: formData,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(
                typeof data?.error === "string" ? data.error : "Yorum görseli yüklenemedi"
            );
        }

        return typeof data?.url === "string" ? data.url : null;
    } catch (error: unknown) {
        console.error("Review image upload error:", error);
        return null;
    }
}

export async function uploadFileToCloudinary(file: File): Promise<string | null> {
    const config = getCloudinaryConfig();

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", config.uploadPreset);

        const res = await fetch(config.uploadUrl, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Cloudinary Error Details:", data);
            throw new Error(data.error?.message || "Upload failed");
        }

        return data.secure_url || null;
    } catch (error: any) {
        console.error("File upload error:", error);
        return null;
    }
}

export async function processHtmlImages(html: string): Promise<string> {
    if (!html) return "";

    const base64Regex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
    let newHtml = html;

    const matches = Array.from(html.matchAll(base64Regex));

    const uploadPromises = matches.map(async (match) => {
        const fullMatch = match[0];
        const base64Data = match[1];

        const uploadedUrl = await uploadBase64ToCloudinary(base64Data);
        return {
            original: base64Data,
            uploaded: uploadedUrl
        };
    });

    const results = await Promise.all(uploadPromises);

    for (const result of results) {
        if (result.uploaded) {
            newHtml = newHtml.replace(result.original, result.uploaded);
        }
    }

    return newHtml;
}
