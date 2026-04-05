import { z } from "zod";

export const sizeTypeEnum = z.enum(["letter", "number", "cup"]);
export const statusEnum = z.enum(["draft", "published", "archived"]);

export const productVariantSchema = z.object({
    colorName: z.string().min(1, "Renk adÄ± zorunludur"),
    hexCode: z.string().min(1, "Renk kodu zorunludur"),
    images: z.array(z.string()).min(1, "En az 1 gÃ¶rsel yÃ¼klemelisiniz"),
    stock: z.record(z.string(), z.number().min(0)).refine((val) => Object.keys(val).length > 0, {
        message: "En az bir beden stoÄŸu girmelisiniz",
    }),
    isOpen: z.boolean().optional(),

    price: z.coerce.number().optional(),
    originalPrice: z.coerce.number().optional(),
    useMainPrice: z.boolean().default(true),
});

export const productSchema = z.object({
    name: z.string().min(2, "ÃœrÃ¼n adÄ± en az 2 karakter olmalÄ±dÄ±r"),
    description: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional(),

    price: z.coerce.number().min(0.01, "Fiyat 0'dan bÃ¼yÃ¼k olmalÄ±dÄ±r"),
    originalPrice: z.coerce.number().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    date: z.date().optional(), // For logic if needed, usually not in form input directly but handled by backend

    isTrackInventory: z.boolean().default(true),
    allowBackorders: z.boolean().default(false),
    isTaxable: z.boolean().default(true),

    isVariable: z.boolean().default(false),
    sizeType: sizeTypeEnum.default("letter"),

    simpleStock: z.record(z.string(), z.number().min(0)).optional(),

    variants: z.array(productVariantSchema).optional(),

    status: statusEnum.default("draft"),
    categoryId: z.string().min(1, "Kategori seÃ§melisiniz"),
    brand: z.string().optional(),
    tags: z.array(z.string()).default([]),

    slug: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),

    primaryImage: z.string().optional(),
    secondaryImage: z.string().optional(),
    uploadedImages: z.array(z.string()).default([]),

    mainColorName: z.string().optional(),
    mainColorHex: z.string().optional(),
}).refine((data) => {
    if (data.isVariable) {
        return data.variants && data.variants && data.variants.length > 0;
    } else {
        return true;
    }
}, {
    message: "VaryantlÄ± Ã¼rÃ¼n iÃ§in en az bir varyant (renk) eklemelisiniz",
    path: ["variants"],
}).refine((data) => {
    if (data.originalPrice && data.originalPrice > 0) {
        return data.originalPrice <= data.price;
    }
    return true;
}, {
    message: "Ä°ndirimsiz fiyat, satÄ±ÅŸ fiyatÄ±ndan bÃ¼yÃ¼k olamaz",
    path: ["originalPrice"],
});

export type ProductFormValues = z.infer<typeof productSchema>;
