import { useState, useEffect } from 'react';

export type Category = {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    gender?: string | null;
    group?: string | null;
};

type UseCategoriesOptions = {
    productGender?: "MALE" | "FEMALE";
    includeUnisex?: boolean;
    withProducts?: boolean;
};

const categoryCache = new Map<string, Category[]>();

function buildCategoryCacheKey(options?: UseCategoriesOptions) {
    const params = new URLSearchParams();
    if (options?.productGender) {
        params.set("productGender", options.productGender);
    }
    if (options?.includeUnisex) {
        params.set("includeUnisex", "true");
    }
    if (options?.withProducts) {
        params.set("withProducts", "true");
    }
    return params.toString();
}

export function useCategories(options?: UseCategoriesOptions) {
    const cacheKey = buildCategoryCacheKey(options);
    const cachedCategories = categoryCache.get(cacheKey) ?? [];
    const [categories, setCategories] = useState<Category[]>(cachedCategories);
    const [loading, setLoading] = useState(cachedCategories.length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            try {
                if (!categoryCache.has(cacheKey)) {
                    setLoading(true);
                }
                const queryString = cacheKey;
                const response = await fetch(`/api/categories/public${queryString ? `?${queryString}` : ""}`);
                if (!response.ok) {
                    throw new Error('Kategoriler yüklenemedi');
                }
                const data = await response.json();
                categoryCache.set(cacheKey, data);
                setCategories(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, [cacheKey]);

    return { categories, loading, error };
}
