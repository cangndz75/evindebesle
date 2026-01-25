/**
 * Input Sanitization Utilities
 * Protect against XSS and injection attacks
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
    };

    return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char]);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize string for safe database storage
 * Removes null bytes and trims whitespace
 */
export function sanitizeString(str: string): string {
    if (typeof str !== "string") return "";
    return str
        .replace(/\0/g, "") // Remove null bytes
        .trim();
}

/**
 * Sanitize object keys and string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key);

        if (typeof value === "string") {
            result[sanitizedKey] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            result[sanitizedKey] = value.map((item) =>
                typeof item === "string"
                    ? sanitizeString(item)
                    : typeof item === "object" && item !== null
                        ? sanitizeObject(item as Record<string, unknown>)
                        : item
            );
        } else if (typeof value === "object" && value !== null) {
            result[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
        } else {
            result[sanitizedKey] = value;
        }
    }

    return result as T;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
    const sanitized = sanitizeString(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitized)) {
        return null;
    }

    return sanitized;
}

/**
 * Validate and sanitize phone number (Turkish format)
 */
export function sanitizePhone(phone: string): string | null {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // Turkish phone: 10 or 11 digits (with or without leading 0)
    if (digits.length === 10) {
        return `0${digits}`;
    } else if (digits.length === 11 && digits.startsWith("0")) {
        return digits;
    } else if (digits.length === 12 && digits.startsWith("90")) {
        return `0${digits.slice(2)}`;
    }

    return null;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
    const sanitized = sanitizeString(url);

    // Check for javascript: or data: schemes
    const lowered = sanitized.toLowerCase();
    if (
        lowered.startsWith("javascript:") ||
        lowered.startsWith("data:") ||
        lowered.startsWith("vbscript:")
    ) {
        return null;
    }

    try {
        // Validate URL format
        new URL(sanitized);
        return sanitized;
    } catch {
        // If not absolute URL, check if it's a valid relative path
        if (sanitized.startsWith("/") && !sanitized.startsWith("//")) {
            return sanitized;
        }
        return null;
    }
}

/**
 * Sanitize slug (URL-friendly string)
 */
export function sanitizeSlug(str: string): string {
    return sanitizeString(str)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with hyphen
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validate price (positive number with max 2 decimal places)
 */
export function sanitizePrice(value: unknown): number | null {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (typeof num !== "number" || isNaN(num) || num < 0) {
        return null;
    }

    // Round to 2 decimal places
    return Math.round(num * 100) / 100;
}

/**
 * Validate positive integer
 */
export function sanitizePositiveInt(value: unknown): number | null {
    const num = typeof value === "string" ? parseInt(value, 10) : value;

    if (typeof num !== "number" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
        return null;
    }

    return num;
}
