export function generateSlug(text: string): string {
  const turkishToEnglish: { [key: string]: string } = {
    'Ã§': 'c', 'Ã‡': 'C',
    'ÄŸ': 'g', 'Ä': 'G',
    'Ä±': 'i', 'Ä°': 'I',
    'Ã¶': 'o', 'Ã–': 'O',
    'ÅŸ': 's', 'Å': 'S',
    'Ã¼': 'u', 'Ãœ': 'U',
  };

  let slug = text;

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

export function generateVariantCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateProductSlug(
  productName: string,
  categoryName?: string | null,
  firstColorName?: string | null
): string {
  const parts: string[] = [];

  if (categoryName) {
    parts.push(generateSlug(categoryName));
  }

  if (firstColorName) {
    parts.push(generateSlug(firstColorName));
  }

  parts.push(generateSlug(productName));

  return parts.join('-');
}

export function generateBlogSlug(title: string, id: string): string {
  const baseSlug = generateSlug(title);
  const partialId = id.slice(0, 8);
  return `${baseSlug}-${partialId}`;
}
