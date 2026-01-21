import { type NextRequest, NextResponse } from "next/server";

const MAINTENANCE_ENABLED = process.env.MAINTENANCE_ENABLED === "true";
const MAINTENANCE_PATH = "/maintenance";

export function proxy(request: NextRequest) {
  if (!MAINTENANCE_ENABLED) {
    const isMaintenancePage = request.nextUrl.pathname === MAINTENANCE_PATH;

    if (isMaintenancePage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const isMaintenancePage = request.nextUrl.pathname === MAINTENANCE_PATH;
  const isAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon");

  if (isMaintenancePage || isAsset) {
    return NextResponse.next();
  }

  const isApi = request.nextUrl.pathname.startsWith("/api");

  if (isApi) {
    return NextResponse.json(
      {
        success: false,
        type: "MaintenanceError",
        message: "Service en maintenance",
      },
      { status: 503 }
    );
  }

  return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
