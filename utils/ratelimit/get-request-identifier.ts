import "server-only";

import { headers } from "next/headers";

function extractIpFromHeaders(
  getHeader: (name: string) => string | null,
): string {
  const cfConnectingIp = getHeader("cf-connecting-ip");
  const realIp = getHeader("x-real-ip");
  const forwardedFor = getHeader("x-forwarded-for");

  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  const lastIp = forwardedFor?.split(",").at(-1)?.trim();

  if (lastIp) {
    return lastIp;
  }

  if (process.env.NODE_ENV === "development") {
    return "dev-localhost";
  }

  console.warn(
    "[Rate Limit] Unable to determine client IP. Using fallback identifier 'unknown'. This may cause all users to share the same rate limit.",
  );

  return "unknown";
}

function getRequestIdentifier(request: Request): string {
  return extractIpFromHeaders((name: string) => request.headers.get(name));
}

async function getActionIdentifier(): Promise<string> {
  const headersList = await headers();

  return extractIpFromHeaders((name: string) => headersList.get(name));
}

export { getActionIdentifier, getRequestIdentifier };
