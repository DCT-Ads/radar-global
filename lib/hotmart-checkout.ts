export function hotmartCheckoutUrls() {
  return {
    standard: process.env.NEXT_PUBLIC_HOTMART_STANDARD_URL?.trim() || "",
    premium: process.env.NEXT_PUBLIC_HOTMART_PREMIUM_URL?.trim() || "",
  };
}
