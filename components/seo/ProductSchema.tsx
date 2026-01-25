interface ProductSchemaProps {
    product: {
        name: string;
        description: string;
        image: string[];
        sku: string;
        brand: string;
        price: number;
        originalPrice?: number;
        currency: string;
        inStock: boolean;
        url: string;
        rating?: number;
        reviewCount?: number;
    };
}

export default function ProductSchema({ product }: ProductSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image,
        sku: product.sku,
        brand: {
            "@type": "Brand",
            name: product.brand,
        },
        offers: {
            "@type": "Offer",
            url: product.url,
            priceCurrency: product.currency,
            price: product.price,
            priceValidUntil: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString().split("T")[0],
            availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: {
                "@type": "Organization",
                name: "Evinde Besle",
            },
        },
        ...(product.rating &&
            product.reviewCount && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating.toFixed(1),
                reviewCount: product.reviewCount,
                bestRating: "5",
                worstRating: "1",
            },
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
