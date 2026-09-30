"use client";

import { useState } from "react";
import { PREMIUM_EUR_79_ANNUAL } from "@/lib/auth/access";

type EspanolOrderBumpProps = {
  monthlyHref: string;
  annualHref: string;
  copy: {
    bumpBadge: string;
    bumpTitle: string;
    bumpBody: string;
    bumpWas: string;
    bumpTotal: string;
    ctaMonthly: string;
    ctaBump: string;
  };
};

export function EspanolOrderBump({
  monthlyHref,
  annualHref,
  copy,
  defaultChecked = false,
}: EspanolOrderBumpProps & { defaultChecked?: boolean }) {
  const [bump, setBump] = useState(defaultChecked);
  const href = bump ? annualHref || monthlyHref : monthlyHref;
  const ctaClass =
    "inline-flex h-11 w-full items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90 sm:w-auto";

  return (
    <div className="mt-6 w-full space-y-4 text-left">
      <label className="block cursor-pointer rounded-2xl border border-[#D4AF37] bg-[#0B1C33]/40 p-5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={bump}
            onChange={(event) => setBump(event.target.checked)}
            className="mt-1 size-4 accent-[#D4AF37]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              {copy.bumpBadge}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{copy.bumpTitle}</h3>
            <p className="mt-2 text-sm text-[#8BA3B8] line-through">{copy.bumpWas}</p>
            <p className="mt-1 text-2xl font-semibold">{PREMIUM_EUR_79_ANNUAL.installment}</p>
            <p className="mt-1 text-sm text-[#D4AF37]">{copy.bumpTotal}</p>
            <p className="mt-2 text-sm text-[#F5F7FA]">{copy.bumpBody}</p>
          </div>
        </div>
      </label>

      <a href={href} className={ctaClass}>
        {bump ? copy.ctaBump : copy.ctaMonthly}
      </a>
    </div>
  );
}
