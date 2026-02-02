const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export default function WebSiteSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Dark Velvet",
        url: BASE_URL,
        description: "Premium iç ve dış giyim koleksiyonu. Kadın ve erkek için kaliteli iç çamaşırı, külot, sütyen, boxer, sweat ve daha fazlası.",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${BASE_URL}/products?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        },
        inLanguage: "tr-TR",
        publisher: {
            "@type": "Organization",
            name: "Dark Velvet",
            url: BASE_URL,
            logo: `${BASE_URL}/logo.png`
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
