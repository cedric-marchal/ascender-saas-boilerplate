import { type NextRequest, NextResponse } from "next/server";

import { getSessionCookie } from "better-auth/cookies";

const MAINTENANCE_ENABLED = process.env.MAINTENANCE_ENABLED === "true";
const MAINTENANCE_PATH = "/maintenance";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/stripe/webhooks"];

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "on",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(
    ([key, value]: [string, string]) => {
      response.headers.set(key, value);
    }
  );
  return response;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix: string) =>
    pathname.startsWith(prefix)
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  if (!pathname.startsWith("/api")) {
    return false;
  }

  return !PUBLIC_API_PREFIXES.some((prefix: string) =>
    pathname.startsWith(prefix)
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (MAINTENANCE_ENABLED) {
    const isMaintenancePage = pathname === MAINTENANCE_PATH;
    const isAsset =
      pathname.startsWith("/_next") || pathname.startsWith("/favicon");

    if (isMaintenancePage || isAsset) {
      return applySecurityHeaders(NextResponse.next());
    }

    if (pathname.startsWith("/api")) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            type: "MaintenanceError",
            message: "Service en maintenance",
          },
          { status: 503 }
        )
      );
    }

    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  if (pathname === MAINTENANCE_PATH) {
    return NextResponse.redirect(new URL("/", request.url));
  }

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
            { status: 401 }
          )
        );
      }

      const signInUrl = new URL("/connexion", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
