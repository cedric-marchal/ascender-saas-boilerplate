import "server-only";

function getRequestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  if (process.env.NODE_ENV === "development") {
    return "dev-localhost";
  }

  console.warn(
    "[Rate Limit] Unable to determine client IP. Using fallback identifier 'unknown'. This may cause all users to share the same rate limit."
  );

  return "unknown";
}

export { getRequestIdentifier };
