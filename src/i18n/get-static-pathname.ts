import { routing } from "@/i18n/routing";
import type { Locale } from "next-intl";

type StaticPathnameKey = keyof typeof routing.pathnames;

/**
 * Resolves a locale-prefixed pathname from `routing.pathnames` without
 * depending on `next-intl/navigation`'s `createNavigation` (which resolves
 * to a React-server/React-client specific bundle importing `next/navigation`
 * — unusable outside a Next.js request, e.g. in React Email templates
 * rendered by Better Auth hooks or Vitest). Reads the same static
 * `routing.pathnames` config as `@/i18n/navigation`'s `getPathname`, so the
 * two never drift.
 */
function getStaticPathname(href: StaticPathnameKey, locale: Locale): string {
  const entry = routing.pathnames[href];
  const localizedPath = typeof entry === "string" ? entry : entry[locale];

  return `/${locale}${localizedPath}`;
}

export { getStaticPathname };
