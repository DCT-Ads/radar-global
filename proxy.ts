import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySession } from "./lib/auth/jwt";

const intlMiddleware = createMiddleware(routing);

const publicPathnames = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/oferta",
  "/anual",
  "/upsell",
  "/eu",
  "/espanol",
  "/mensual",
  "/pressle",
  "/pressle-3",
  "/standard",
  "/standard-5460",
  "/standard-546",
  "/premium-7990",
  "/premium-799",
  "/planes",
  "/gracias",
  "/gracias/esperando",
  "/gracias/analisis",
  "/bienvenido",
  "/mas-tarde",
  "/upsell-es",
  "/bem-vindo",
  "/outra-oportunidade",
  "/obrigado",
  "/obrigado/aguardando",
  "/obrigado/analise",
  "/privacidade",
  "/termos",
  "/reembolso",
  "/contato",
]);
const authPathnames = new Set(["/login", "/signup"]);
const brLockedPathnames = new Set([
  "/",
  "/oferta",
  "/anual",
  "/upsell",
  "/bem-vindo",
  "/outra-oportunidade",
  "/privacidade",
  "/termos",
  "/reembolso",
  "/contato",
]);

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

  if (brLockedPathnames.has(pathname) && locale !== "pt") {
    const locked = new URL(pathname, request.url);
    locked.search = request.nextUrl.search;
    const response = NextResponse.redirect(locked);
    response.cookies.set("NEXT_LOCALE", "pt", { path: "/", sameSite: "lax" });
    return response;
  }

  const isPublic = publicPathnames.has(pathname) || pathname === "/p" || pathname.startsWith("/p/");
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
