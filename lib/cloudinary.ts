/**
 * Cloudinary Yapılandırmasını dinamik olarak alır.
 * Eğer env değişkenleri okunamazsa manuel (hardcoded) değerleri kullanır.
 */
const getCloudinaryConfig = () => {
    // Env değişkenlerini dene
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Eğer Env okunamazsa (Hata almamak için) Manuel değerleri kullan
    if (!cloudName) cloudName = "dlahfchej";
    if (!uploadPreset) uploadPreset = "appointment_uploads";

    return {
        cloudName,
        uploadPreset,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    };
};

/**
 * Uploads a base64 encoded image string to Cloudinary.
 */
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
 * Uploads a File object to Cloudinary.
 */
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

/**
 * HTML içindeki base64 resimleri bulur ve Cloudinary'ye yükler.
 */
export async function processHtmlImages(html: string): Promise<string> {
    if (!html) return "";

    const base64Regex = /src="(data:image\/[^;]+;base64,[^"]+)"/g;
    let newHtml = html;

    const matches = Array.from(html.matchAll(base64Regex));

    // Eşzamanlı yükleme işlemi
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

    // URL değişimlerini uygula
    for (const result of results) {
        if (result.uploaded) {
            newHtml = newHtml.replace(result.original, result.uploaded);
        }
    }

    return newHtml;
}
