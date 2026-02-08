import { useState, useEffect } from 'react';

export type Category = {
    id: string;
    name: string;
    slug: string;
    image: string | null;
};

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch('/api/categories/public');
                if (!response.ok) {
                    throw new Error('Kategoriler yüklenemedi');
                }
                const data = await response.json();
                setCategories(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, []);

    return { categories, loading, error };
}
