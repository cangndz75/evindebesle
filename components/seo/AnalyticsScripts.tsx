"use client";

import Script from "next/script";

export default function AnalyticsScripts() {
    const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
    const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

    return (
        <>
            {/* Google Analytics 4 */}
            {GA4_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', {
                page_path: window.location.pathname,
              });
            `}
                    </Script>
                </>
            )}

            {/* Facebook Pixel */}
            {FB_PIXEL_ID && (
                <Script id="facebook-pixel" strategy="afterInteractive">
                    {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
                </Script>
            )}
        </>
    );
}
