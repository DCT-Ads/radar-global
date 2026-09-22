"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { PREMIUM_ANNUAL_EUR, PREMIUM_EUR } from "@/lib/auth/access";

type EuroOrderBumpProps = {
  monthlyHref: string;
  annualHref: string;
  copy: {
    monthlyName: string;
    monthlyPrice: string;
    monthlyNote: string;
    bumpTitle: string;
    bumpBody: string;
    wasPrice: string;
    equalsTotal: string;
    ctaMonthly: string;
    ctaBump: string;
  };
};

export function EuroOrderBump({
  monthlyHref,
  annualHref,
  copy,
}: EuroOrderBumpProps) {
  const [bump, setBump] = useState(false);
  const href = bump ? annualHref || monthlyHref : monthlyHref;
  const external = href.startsWith("http");
  const ctaClass =
    "inline-flex h-11 w-full items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90 sm:w-auto";

  return (
    <div className="mt-8 w-full max-w-xl space-y-4 text-left">
      <div className="rounded-2xl border border-[#1E3A5F] bg-[#12263F]/90 p-6">
        <h2 className="text-2xl font-semibold text-[#D4AF37]">{copy.monthlyName}</h2>
        <p className="mt-2 text-4xl font-semibold">{PREMIUM_EUR.monthlyLabel}</p>
        <p className="mt-1 text-sm text-[#8BA3B8]">{copy.monthlyNote}</p>
      </div>

      <label className="block cursor-pointer rounded-2xl border border-[#D4AF37] bg-[#12263F]/90 p-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={bump}
            onChange={(event) => setBump(event.target.checked)}
            className="mt-1 size-4 accent-[#D4AF37]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Order bump
            </p>
            <h3 className="mt-1 text-xl font-semibold">{copy.bumpTitle}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8] line-through">{copy.wasPrice}</p>
            <p className="mt-1 text-2xl font-semibold">{PREMIUM_ANNUAL_EUR.installment}</p>
            <p className="mt-1 text-sm text-[#D4AF37]">{copy.equalsTotal}</p>
            <p className="mt-2 text-sm text-[#F5F7FA]">{copy.bumpBody}</p>
          </div>
        </div>
      </label>

      {external ? (
        <a href={href} className={ctaClass}>
          {bump ? copy.ctaBump : copy.ctaMonthly}
        </a>
      ) : (
        <Link href={href} className={ctaClass}>
          {bump ? copy.ctaBump : copy.ctaMonthly}
        </Link>
      )}
    </div>
  );
}
