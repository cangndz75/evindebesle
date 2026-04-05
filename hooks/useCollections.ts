import { useState, useEffect } from "react";

export type Collection = {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
};

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collections/public");
        if (res.ok) {
          const data = await res.json();
          setCollections(data.filter((c: Collection) => c.isActive));
        }
      } catch (error) {
        console.error("Collections fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, loading };
};
