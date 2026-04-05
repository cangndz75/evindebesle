const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export default function OrganizationSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Dark Velvet",
        legalName: "Dark Velvet",
        alternateName: "Dark Velvet İç Giyim",
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        image: `${BASE_URL}/logo.png`,
        description: "Türkiye'nin önde gelen premium iç ve dış giyim markası. Kadın ve erkek için kaliteli iç çamaşırı, külot, sütyen, boxer, sweat ve daha fazlası.",
        knowsAbout: ["kadin giyim", "erkek giyim", "ic giyim", "premium moda", "online alisveris"],
        address: {
            "@type": "PostalAddress",
            addressCountry: "TR",
            addressLocality: "İstanbul",
        },
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["Turkish", "tr"],
                email: "info@darkvelvet.com",
                areaServed: "TR"
            },
            {
                "@type": "ContactPoint",
                contactType: "sales",
                availableLanguage: ["Turkish", "tr"],
                areaServed: "TR"
            }
        ],
        sameAs: [
            "https://www.instagram.com/darkvelvet0/",
            "https://www.facebook.com/darkvelvet",
        ],
        paymentAccepted: ["Credit Card", "Debit Card", "Online Payment"],
        priceRange: "₺₺",
        currenciesAccepted: "TRY",
        areaServed: {
            "@type": "Country",
            name: "Turkey"
        },
        openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            opens: "00:00",
            closes: "23:59"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
