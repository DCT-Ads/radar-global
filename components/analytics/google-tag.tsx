import Script from "next/script";

export const GOOGLE_ADS_TAG_ID =
  process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim() || "AW-18475129530";

export function GoogleTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_TAG_ID}');`}
      </Script>
    </>
  );
}
