export function hotmartCheckoutUrls() {
  return {
    standard: process.env.NEXT_PUBLIC_HOTMART_STANDARD_URL?.trim() || "",
    premium: process.env.NEXT_PUBLIC_HOTMART_PREMIUM_URL?.trim() || "",
    premiumEuroMonthly: process.env.NEXT_PUBLIC_HOTMART_PREMIUM_EU_MONTHLY_URL?.trim() || "",
    premiumEuroAnnual: withSplit(
      process.env.NEXT_PUBLIC_HOTMART_PREMIUM_EU_URL?.trim() || "",
      "10",
    ),
    premiumBrAnnual: process.env.NEXT_PUBLIC_HOTMART_PREMIUM_BR_ANNUAL_URL?.trim() || "",
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
