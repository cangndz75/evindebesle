const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export default function OrganizationSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Dark Velvet",
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        description: "Premium Giyim ve Stil Koleksiyonu",
        address: {
            "@type": "PostalAddress",
            addressCountry: "TR",
            addressLocality: "İstanbul",
        },
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: "Turkish",
        },
        sameAs: [
            "https://www.instagram.com/darkvelvet",
            "https://www.facebook.com/darkvelvet",
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
