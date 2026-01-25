const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

export default function OrganizationSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Evinde Besle",
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        description: "Evcil hayvan ürünleri ve bakım hizmetleri",
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
            "https://www.instagram.com/evindebesle",
            "https://www.facebook.com/evindebesle",
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
