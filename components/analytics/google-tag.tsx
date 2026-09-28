export const GOOGLE_ADS_TAG_ID =
  process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim() || "AW-18475129530";

/** Snippet oficial no <head> para o Google Ads e a Tag Assistant encontrarem a tag. */
export function GoogleTag() {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_TAG_ID}');`,
        }}
      />
    </>
  );
}
