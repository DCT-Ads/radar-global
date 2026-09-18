"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: "/" | "/dashboard";
  size?: number;
  showName?: boolean;
  className?: string;
};

export function BrandLogo({
  href = "/dashboard",
  size = 32,
  showName = true,
  className,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 text-primary", className)}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={size}
        height={size}
        className="rounded-md"
      />
      {showName ? (
        <span className="text-lg font-semibold tracking-tight">Radar Global</span>
      ) : null}
    </Link>
  );
}
