"use client";

import Script from "next/script";

declare global {
  interface Window {
    checkoutElements?: {
      init: (name: string) => { mount: (selector: string) => void };
    };
  }
}

export function HotmartSalesFunnel() {
  return (
    <div className="mt-8 w-full overflow-hidden rounded-2xl border border-[#D4AF37] bg-white p-2 text-left">
      <div id="hotmart-sales-funnel" />
      <Script
        src="https://checkout.hotmart.com/lib/hotmart-checkout-elements.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.checkoutElements?.init("salesFunnel").mount("#hotmart-sales-funnel");
        }}
      />
    </div>
  );
}
