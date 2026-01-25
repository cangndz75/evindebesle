/**
 * Converts a string to a URL-friendly slug
 * Example: "Drop-Cut Long Sleeve: LUX" -> "drop-cut-long-sleeve-lux"
 * Turkish characters are converted to their English equivalents
 */
export function generateSlug(text: string): string {
  // Türkçe karakterleri İngilizce karşılıklarına dönüştür
  const turkishToEnglish: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };

  let slug = text;

  // Türkçe karakterleri değiştir
  for (const [turkish, english] of Object.entries(turkishToEnglish)) {
    slug = slug.replace(new RegExp(turkish, 'g'), english);
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique variant code
 * Format: random alphanumeric string (e.g., "a8z59lfx")
 */
export function generateVariantCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a product slug with category, color, and product name
 * Format: "kategori-renk-urun-adi"
 * Example: "kadin-siyah-sweatshirt"
 */
export function generateProductSlug(
  productName: string,
  categoryName?: string | null,
  firstColorName?: string | null
): string {
  const parts: string[] = [];

  // Kategori ekle
  if (categoryName) {
    parts.push(generateSlug(categoryName));
  }

  // İlk renk ekle (varsa)
  if (firstColorName) {
    parts.push(generateSlug(firstColorName));
  }

  // Ürün adı ekle
  parts.push(generateSlug(productName));

  return parts.join('-');
}

/**
 * Generates a blog slug with a partial ID for uniqueness
 * Format: "evcil-hayvan-bakimi-cmku4mf"
 */
export function generateBlogSlug(title: string, id: string): string {
  const baseSlug = generateSlug(title);
  // Take first 8 chars of id (cuid usually starts with c...)
  const partialId = id.slice(0, 8);
  return `${baseSlug}-${partialId}`;
}
