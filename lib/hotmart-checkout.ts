/** Checkout Brasil do produto Hotmart (modo personalizado). */
export const HOTMART_BR_CHECKOUT =
  "https://pay.hotmart.com/B107672953D?checkoutMode=10";

export function hotmartCheckoutUrls() {
  return {
    standard: process.env.NEXT_PUBLIC_HOTMART_STANDARD_URL?.trim() || HOTMART_BR_CHECKOUT,
    premium: process.env.NEXT_PUBLIC_HOTMART_PREMIUM_URL?.trim() || HOTMART_BR_CHECKOUT,
    premiumEuroMonthly:
      process.env.NEXT_PUBLIC_HOTMART_PREMIUM_EU_MONTHLY_URL?.trim() || HOTMART_BR_CHECKOUT,
    premiumEuroAnnual: withSplit(
      process.env.NEXT_PUBLIC_HOTMART_PREMIUM_EU_URL?.trim() || HOTMART_BR_CHECKOUT,
      "10",
    ),
    premiumBrAnnual:
      process.env.NEXT_PUBLIC_HOTMART_PREMIUM_BR_ANNUAL_URL?.trim() ||
      "https://pay.hotmart.com/B107672953D?off=i148m1&checkoutMode=10",
    premiumEsPromo:
      process.env.NEXT_PUBLIC_HOTMART_PREMIUM_ES_URL?.trim() || HOTMART_BR_CHECKOUT,
  };
}

function withSplit(url: string, split: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("split", split);
    return parsed.toString();
  } catch {
    return url;
  }
}
