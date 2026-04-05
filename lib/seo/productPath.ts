type ProductPathInput = {
  id: string;
  slug?: string | null;
  gender?: string | null;
  categorySlug?: string | null;
};

function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeGenderSlug(gender?: string | null) {
  if (gender === "FEMALE") return "kadin";
  if (gender === "MALE") return "erkek";
  return "unisex";
}

export function buildProductPath(input: ProductPathInput) {
  const genderSlug = normalizeGenderSlug(input.gender);
  const categorySlug = slugifyPart(input.categorySlug || "urunler");
  const productSlug = slugifyPart(input.slug || input.id);

  return `/${genderSlug}/${categorySlug}/${productSlug}`;
}

export function buildProductAbsoluteUrl(baseUrl: string, input: ProductPathInput) {
  return `${baseUrl}${buildProductPath(input)}`;
}
