import { NextResponse, type NextRequest } from "next/server";

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

function generateCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com${isDev ? " 'unsafe-inline' 'unsafe-eval'" : " 'strict-dynamic'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://lh3.googleusercontent.com${isDev ? " https://picsum.photos https://fastly.picsum.photos" : ""}`,
    "font-src 'self'",
    "connect-src 'self' https://*.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
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

  // Auth check — routes protégées sans cookie de session
  const isProtected =
    isProtectedRoute(pathname) || isProtectedApiRoute(pathname);
  const sessionCookie = isProtected ? getSessionCookie(request) : null;

  // Non authentifié — API protégée → 401
  if (isProtected && !sessionCookie && isApi) {
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

  // Non authentifié — page protégée → redirection connexion
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/connexion", request.url));
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
