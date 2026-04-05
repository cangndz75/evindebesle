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
        shippingPrice?: number;
        freeShippingThreshold?: number;
        returnWindowDays?: number;
        returnPolicyUrl?: string;
        reviews?: {
            authorName?: string | null;
            rating: number;
            comment?: string | null;
            createdAt?: string | Date;
        }[];
    };
}

export default function ProductSchema({ product }: ProductSchemaProps) {
    const hasAggregateRating =
        typeof product.rating === "number" &&
        product.rating > 0 &&
        typeof product.reviewCount === "number" &&
        product.reviewCount > 0;

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
                shippingRate: {
                    "@type": "MonetaryAmount",
                    value: typeof product.shippingPrice === "number" ? product.shippingPrice : 49.9,
                    currency: product.currency,
                },
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
            },
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "TR",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: product.returnWindowDays || 14,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
                ...(product.returnPolicyUrl ? { url: product.returnPolicyUrl } : {}),
            },
            ...(typeof product.freeShippingThreshold === "number"
                ? {
                    eligibleTransactionVolume: {
                        "@type": "PriceSpecification",
                        priceCurrency: product.currency,
                        minPrice: product.freeShippingThreshold,
                    },
                }
                : {}),
        },
        ...(hasAggregateRating && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating!.toFixed(1),
                reviewCount: product.reviewCount!,
                bestRating: "5",
                worstRating: "1",
            },
        }),
        ...(product.reviews && product.reviews.length > 0 && {
            review: product.reviews.map((review) => ({
                "@type": "Review",
                ...(review.authorName
                    ? {
                        author: {
                            "@type": "Person",
                            name: review.authorName,
                        },
                    }
                    : {}),
                ...(review.comment ? { reviewBody: review.comment } : {}),
                reviewRating: {
                    "@type": "Rating",
                    ratingValue: review.rating,
                    bestRating: "5",
                    worstRating: "1",
                },
                ...(review.createdAt
                    ? {
                        datePublished: new Date(review.createdAt)
                            .toISOString()
                            .split("T")[0],
                    }
                    : {}),
            })),
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
