import "server-only";

import { headers } from "next/headers";

function getRequestIdentifier(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");

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

async function getActionIdentifier(): Promise<string> {
  const headersList = await headers();
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  const realIp = headersList.get("x-real-ip");
  const forwardedFor = headersList.get("x-forwarded-for");

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

export { getActionIdentifier, getRequestIdentifier };
