import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

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

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(200, "1 m"),
  ephemeralCache: new Map(),
  analytics: true,
  prefix: "@upstash/ratelimit/proxy",
});

function generateCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev",
    "font-src 'self'",
    "connect-src 'self' https://*.stripe.com https://*.sentry.io https://*.ingest.sentry.io",
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Maintenance mode — court-circuit total
  if (MAINTENANCE_ENABLED) {
    const isMaintenancePage = pathname === MAINTENANCE_PATH;
    const isAsset =
      pathname.startsWith("/_next") || pathname.startsWith("/favicon");

    if (isMaintenancePage || isAsset) {
      return applySecurityHeaders(NextResponse.next(), nonce);
    }

    if (pathname.startsWith("/api")) {
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

    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  // Redirige /maintenance vers / quand hors maintenance
  if (pathname === MAINTENANCE_PATH) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Rate limiting IP — couvre pages, nuqs, API routes et server actions
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    if (pathname.startsWith("/api")) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            type: "TooManyRequestsError",
            message: "Trop de requêtes, veuillez réessayer plus tard",
          },
          { status: 429 },
        ),
        nonce,
      );
    }

    return applySecurityHeaders(
      new NextResponse("Trop de requêtes, veuillez réessayer plus tard", {
        status: 429,
      }),
      nonce,
    );
  }

  // Auth check — routes protégées sans cookie de session
  if (isProtectedRoute(pathname) || isProtectedApiRoute(pathname)) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      if (pathname.startsWith("/api")) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              type: "UnauthorizedError",
              message: "Vous devez être connecté",
            },
            { status: 401 },
          ),
          nonce,
        );
      }

      const signInUrl = new URL("/connexion", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Passage normal avec headers de sécurité et nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return applySecurityHeaders(response, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
