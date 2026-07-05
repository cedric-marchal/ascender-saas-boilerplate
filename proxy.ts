import { NextRequest, NextResponse } from "next/server";

import { getLocaleFromRequest } from "@/i18n/get-locale-from-request";
import { getTranslator } from "@/i18n/get-translator";
import { isLegacyFrenchPath } from "@/i18n/legacy-redirects";
import { routing } from "@/i18n/routing";
import { getSessionCookie } from "better-auth/cookies";
import type { Locale } from "next-intl";
import createMiddleware from "next-intl/middleware";

const MAINTENANCE_ENABLED = process.env.MAINTENANCE_ENABLED === "true";
const MAINTENANCE_PATH = "/maintenance";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/stripe/webhooks"];

const STATIC_SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "on",
};

const LOCALE_PREFIX_PATTERN = new RegExp(
  `^/(${routing.locales.join("|")})(/.*)?$`,
);

const handleI18nRouting = createMiddleware(routing);

function generateCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : " 'strict-dynamic'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://lh3.googleusercontent.com${isDev ? " https://picsum.photos https://fastly.picsum.photos" : ""}`,
    "font-src 'self'",
    "connect-src 'self' https://*.stripe.com",
    "frame-src https://*.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function applySecurityHeaders(
  response: NextResponse,
  nonce: string,
): NextResponse {
  Object.entries(STATIC_SECURITY_HEADERS).forEach(
    ([key, value]: [string, string]) => {
      response.headers.set(key, value);
    },
  );
  response.headers.set("Content-Security-Policy", generateCsp(nonce));

  return response;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix: string) =>
    pathname.startsWith(prefix),
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  if (!pathname.startsWith("/api")) {
    return false;
  }

  return !PUBLIC_API_PREFIXES.some((prefix: string) =>
    pathname.startsWith(prefix),
  );
}

/**
 * Splits an incoming pathname into its locale prefix (when present) and the
 * remainder, without ever branching on a specific locale value — any locale
 * not present in the URL falls back to `routing.defaultLocale`.
 */
function splitLocaleFromPathname(pathname: string): {
  locale: Locale;
  pathnameWithoutLocale: string;
} {
  const match = pathname.match(LOCALE_PREFIX_PATTERN);

  if (!match) {
    return { locale: routing.defaultLocale, pathnameWithoutLocale: pathname };
  }

  return {
    locale: match[1] as Locale,
    pathnameWithoutLocale: match[2] || "/",
  };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isApi = pathname.startsWith("/api");
  const isMaintenancePage = pathname === MAINTENANCE_PATH;
  const isAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  // Maintenance — assets et page maintenance passent toujours
  if (MAINTENANCE_ENABLED && (isMaintenancePage || isAsset)) {
    return applySecurityHeaders(NextResponse.next(), nonce);
  }

  // Maintenance — API → 503
  if (MAINTENANCE_ENABLED && isApi) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          success: false,
          type: "MaintenanceError",
          message: "Service en maintenance",
        },
        { status: 503 },
      ),
      nonce,
    );
  }

  // Maintenance — pages → redirection
  if (MAINTENANCE_ENABLED) {
    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  // Redirige /maintenance vers / quand hors maintenance
  if (isMaintenancePage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // API and assets — no locale negotiation, security headers + auth API
  if (isApi || isAsset) {
    const sessionCookie = isProtectedApiRoute(pathname)
      ? getSessionCookie(request)
      : null;

    if (isProtectedApiRoute(pathname) && !sessionCookie) {
      const translate = getTranslator(getLocaleFromRequest(request));

      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            type: "UnauthorizedError",
            message: translate("errors.common.unauthenticated"),
          },
          { status: 401 },
        ),
        nonce,
      );
    }

    return applySecurityHeaders(NextResponse.next(), nonce);
  }

  // Legacy — unprefixed French URLs → 301 to /fr/...
  if (isLegacyFrenchPath(pathname)) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(`/fr${pathname}`, request.url), 301),
      nonce,
    );
  }

  // next-intl locale negotiation (prefix + localized slug rewrite)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const requestWithNonce = new NextRequest(request, {
    headers: requestHeaders,
  });

  const intlResponse = handleI18nRouting(requestWithNonce);

  // Negotiation produced a redirect (prefix added, etc.) — let it proceed,
  // auth will be checked on the following request.
  if (intlResponse.headers.get("location")) {
    return applySecurityHeaders(intlResponse, nonce);
  }

  const { locale, pathnameWithoutLocale } = splitLocaleFromPathname(pathname);

  // Auth check — protected routes without a session cookie
  const isProtected = isProtectedRoute(pathnameWithoutLocale);
  const sessionCookie = isProtected ? getSessionCookie(request) : null;

  // Unauthenticated — protected page → localized sign-in redirect
  if (isProtected && !sessionCookie) {
    const signInPath = routing.pathnames["/sign-in"][locale];

    return applySecurityHeaders(
      NextResponse.redirect(new URL(`/${locale}${signInPath}`, request.url)),
      nonce,
    );
  }

  if (isProtected) {
    intlResponse.headers.set("Cache-Control", "private, no-store");
  }

  return applySecurityHeaders(intlResponse, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
