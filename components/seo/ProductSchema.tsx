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
        color?: string;
        size?: string;
        material?: string;
        gender?: string;
        category?: string;
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
        ...(product.color && { color: product.color }),
        ...(product.size && { size: product.size }),
        ...(product.material && { material: product.material }),
        ...(product.gender && {
            audience: {
                "@type": "PeopleAudience",
                suggestedGender: product.gender === "MALE" ? "Male" : product.gender === "FEMALE" ? "Female" : "Unisex"
            }
        }),
        ...(product.category && { category: product.category }),
        itemCondition: "https://schema.org/NewCondition",
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
                name: "Dark Velvet",
            },
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "TR"
                },
                deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    businessDays: {
                        "@type": "OpeningHoursSpecification",
                        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                    },
                    cutoffTime: "15:00:00",
                    handlingTime: {
                        "@type": "QuantitativeValue",
                        minValue: 1,
                        maxValue: 2,
                        unitCode: "DAY"
                    },
                    transitTime: {
                        "@type": "QuantitativeValue",
                        minValue: 2,
                        maxValue: 3,
                        unitCode: "DAY"
                    }
                }
            }
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
