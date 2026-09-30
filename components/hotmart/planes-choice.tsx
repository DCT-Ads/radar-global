"use client";

import { useEffect, useState } from "react";

type OfferCopy = {
  button: string;
  offer: string;
  compare: string;
  pay10: string;
  perks: string[];
};

type PlanesChoiceProps = {
  placement: "hero" | "final" | "standard" | "premium";
  standardMonthlyHref: string;
  standardAnnualHref: string;
  premiumMonthlyHref: string;
  premiumAnnualHref: string;
  title: string;
  accept: string;
  decline: string;
  pending: string;
  closeLabel: string;
  standard: OfferCopy;
  premium: OfferCopy;
};

const goldButton =
  "inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90";

const outlineButton =
  "inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10";

export function PlanesChoice({
  placement,
  standardMonthlyHref,
  standardAnnualHref,
  premiumMonthlyHref,
  premiumAnnualHref,
  title,
  accept,
  decline,
  pending,
  closeLabel,
  standard,
  premium,
}: PlanesChoiceProps) {
  const [open, setOpen] = useState<"standard" | "premium" | null>(null);
  const offer = open === "premium" ? premium : standard;
  const monthlyHref = open === "premium" ? premiumMonthlyHref : standardMonthlyHref;
  const annualHref = open === "premium" ? premiumAnnualHref : standardAnnualHref;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const showStandard = placement === "hero" || placement === "final" || placement === "standard";
  const showPremium = placement === "hero" || placement === "final" || placement === "premium";

  return (
    <>
      <div
        className={
          placement === "hero" || placement === "final"
            ? "mt-8 flex w-full max-w-xl flex-col items-center gap-3"
            : "mt-6"
        }
      >
        {showStandard ? (
          <button type="button" className={placement === "premium" ? outlineButton : goldButton} onClick={() => setOpen("standard")}>
            {standard.button}
          </button>
        ) : null}
        {showPremium ? (
          <button type="button" className={placement === "standard" ? outlineButton : goldButton} onClick={() => setOpen("premium")}>
            {premium.button}
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1C33]/80 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="planes-bump-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D4AF37] bg-[#12263F] p-6 text-left text-[#F5F7FA] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="planes-bump-title" className="text-xl font-semibold text-[#D4AF37]">
                {title}
              </h2>
              <button type="button" className="text-sm text-[#8BA3B8]" onClick={() => setOpen(null)}>
                {closeLabel}
              </button>
            </div>
            <p className="mt-4 text-base text-[#F5F7FA]">{offer.offer}</p>
            <p className="mt-3 text-sm text-[#8BA3B8] line-through">{offer.compare}</p>
            <p className="mt-1 text-sm font-semibold text-[#D4AF37]">{offer.pay10}</p>
            {open === "premium" ? (
              <ul className="mt-4 space-y-2 text-sm text-[#F5F7FA]">
                {premium.perks.map((perk) => (
                  <li key={perk}>✓ {perk}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 flex flex-col gap-3">
              {annualHref ? (
                <a href={annualHref} className={goldButton}>
                  {accept}
                </a>
              ) : (
                <p className="text-xs text-[#8BA3B8]">{pending}</p>
              )}
              {monthlyHref ? (
                <a href={monthlyHref} className={outlineButton}>
                  {decline}
                </a>
              ) : (
                <p className="text-xs text-[#8BA3B8]">{pending}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
