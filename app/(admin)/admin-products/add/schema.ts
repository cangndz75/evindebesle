import { z } from "zod";

export const sizeTypeEnum = z.enum(["letter", "number", "cup"]);
export const statusEnum = z.enum(["draft", "published", "archived"]);

export const productVariantSchema = z.object({
    colorName: z.string().min(1, "Renk adı zorunludur"),
    hexCode: z.string().min(1, "Renk kodu zorunludur"),
    images: z.array(z.string()).min(1, "En az 1 görsel yüklemelisiniz"),
    // Stok: bedene göre map
    stock: z.record(z.string(), z.number().min(0)).refine((val) => Object.keys(val).length > 0, {
        message: "En az bir beden stoğu girmelisiniz",
    }),
});

export const productSchema = z.object({
    // Basic Info
    name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
    description: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional(),

    // Pricing & SKU
    price: z.coerce.number().min(0.01, "Fiyat 0'dan büyük olmalıdır"),
    originalPrice: z.coerce.number().optional(),
    sku: z.string().optional(),
    date: z.date().optional(), // For logic if needed, usually not in form input directly but handled by backend

    // Inventory Logic
    isTrackInventory: z.boolean().default(true),
    allowBackorders: z.boolean().default(false),
    isTaxable: z.boolean().default(true),

    // Variants Logic
    isVariable: z.boolean().default(false),
    sizeType: sizeTypeEnum.default("letter"),

    // If simple product
    simpleStock: z.record(z.string(), z.number().min(0)).optional(),

    // If variable product
    variants: z.array(productVariantSchema).optional(),

    // Organization
    status: statusEnum.default("draft"),
    categoryId: z.string().min(1, "Kategori seçmelisiniz"),
    brand: z.string().optional(),
    tags: z.array(z.string()).default([]),

    // SEO
    slug: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),

    // Media (Global/Simple)
    primaryImage: z.string().optional(),
    secondaryImage: z.string().optional(),
    uploadedImages: z.array(z.string()).default([]),
}).refine((data) => {
    if (data.isVariable) {
        return data.variants && data.variants.length > 0;
    } else {
        // If simple, strictly speaking we might want check stock > 0 but it's optional
        return true;
    }
}, {
    message: "Varyantlı ürün için en az bir varyant (renk) eklemelisiniz",
    path: ["variants"],
});

export type ProductFormValues = z.infer<typeof productSchema>;
