import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export type ThankYouVariant = "approved" | "pending" | "credit";

type ThankYouScreenProps = {
  variant: ThankYouVariant;
  kicker: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  ctaSignup: string;
  ctaLogin: string;
  footer: string;
};

const variantLook: Record<
  ThankYouVariant,
  { mark: string; imageClass: string; imageWidth: number; imageHeight: number }
> = {
  approved: {
    mark: "✓",
    imageClass: "h-auto w-full max-w-[240px]",
    imageWidth: 480,
    imageHeight: 480,
  },
  pending: {
    mark: "…",
    imageClass:
      "h-auto w-full max-w-3xl rounded-2xl border border-[#1E3A5F] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
    imageWidth: 1920,
    imageHeight: 1080,
  },
  credit: {
    mark: "✦",
    imageClass: "h-auto w-full max-w-xl rounded-2xl border border-[#1E3A5F]",
    imageWidth: 1024,
    imageHeight: 1024,
  },
};

export function ThankYouScreen({
  variant,
  kicker,
  title,
  body,
  imageSrc,
  imageAlt,
  ctaSignup,
  ctaLogin,
  footer,
}: ThankYouScreenProps) {
  const look = variantLook[variant];

  return (
    <main className="relative min-h-screen bg-[#0B1C33] text-[#F5F7FA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-wide text-[#D4AF37]">
          Radar Global
        </Link>
        <LocaleSwitcher />
      </header>
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-[#D4AF37] bg-[#12263F] text-2xl font-semibold text-[#D4AF37]">
          {look.mark}
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
          {kicker}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#8BA3B8]">{body}</p>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={look.imageWidth}
          height={look.imageHeight}
          priority
          className={`mt-8 ${look.imageClass}`}
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B1C33] hover:bg-[#D4AF37]/90"
          >
            {ctaSignup}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#D4AF37] bg-transparent px-6 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            {ctaLogin}
          </Link>
        </div>
        <p className="mt-12 text-xs text-[#8BA3B8]">{footer}</p>
      </section>
    </main>
  );
}
