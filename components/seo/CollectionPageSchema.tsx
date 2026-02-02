interface Product {
    id: string;
    name: string;
    slug?: string;
    price: number;
    image?: string;
}

interface CollectionPageSchemaProps {
    name: string;
    description: string;
    url: string;
    products: Product[];
    minPrice?: number;
    maxPrice?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export default function CollectionPageSchema({
    name,
    description,
    url,
    products,
    minPrice,
    maxPrice
}: CollectionPageSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        description,
        url,
        breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Ana Sayfa",
                    item: `${BASE_URL}/home`
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name,
                    item: url
                }
            ]
        },
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 12).map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                    "@type": "Product",
                    name: product.name,
                    url: `${BASE_URL}/product/${product.slug || product.id}`,
                    image: product.image,
                    offers: {
                        "@type": "Offer",
                        price: product.price,
                        priceCurrency: "TRY"
                    }
                }
            }))
        },
        ...(minPrice && maxPrice && {
            priceRange: `${minPrice} TRY - ${maxPrice} TRY`
        })
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
