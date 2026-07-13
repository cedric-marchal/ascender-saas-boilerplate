import { routing } from "@/i18n/routing";

/**
 * Historically, every page was served unprefixed under its French slug
 * (e.g. `/connexion`, `/tarifs`). Those URLs may still be bookmarked or
 * indexed by search engines. This derives — from the single source of
 * truth in `routing.pathnames` — the list of legacy French pathnames that
 * must keep 301-redirecting to their `/fr/...` equivalent instead of
 * falling through to next-intl's generic (accept-language based) locale
 * negotiation, which could otherwise resolve to `/en/...` and 404.
 */
function buildLegacyFrenchPatterns(): RegExp[] {
  const patterns: RegExp[] = [];

  for (const value of Object.values(routing.pathnames)) {
    if (typeof value === "string") {
      continue;
    }

    const frPath = value.fr;

    if (!frPath) {
      continue;
    }

    const regexSource = `^${frPath.replace(/\[[^\]]+\]/g, "[^/]+")}$`;

    patterns.push(new RegExp(regexSource));
  }

  return patterns;
}

const LEGACY_FRENCH_PATTERNS = buildLegacyFrenchPatterns();

function isLegacyFrenchPath(pathname: string): boolean {
  return LEGACY_FRENCH_PATTERNS.some((pattern: RegExp) =>
    pattern.test(pathname),
  );
}

export { isLegacyFrenchPath };
