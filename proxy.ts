import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySession } from "./lib/auth/jwt";

const intlMiddleware = createMiddleware(routing);

const publicPathnames = new Set(["/", "/login", "/signup"]);
const authPathnames = new Set(["/login", "/signup"]);

function stripLocale(pathname: string) {
  const matchedLocale = routing.locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!matchedLocale) {
    return { locale: routing.defaultLocale, pathname };
  }

  const stripped = pathname.slice(matchedLocale.length + 1) || "/";
  return { locale: matchedLocale, pathname: stripped };
}

function withLocale(pathname: string, locale: string) {
  if (locale === routing.defaultLocale) {
    return pathname;
  }
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export default async function proxy(request: NextRequest) {
  const { locale, pathname } = stripLocale(request.nextUrl.pathname);
  const isPublic = publicPathnames.has(pathname);
  const isAuthPage = authPathnames.has(pathname);
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!isPublic && !session) {
    const loginUrl = new URL(withLocale("/login", locale), request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(withLocale("/dashboard", locale), request.url));
  }

  if (isAdmin && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(withLocale("/dashboard", locale), request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
