import "server-only";

import { revalidatePath } from "next/cache";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Revalidates a canonical route across EVERY locale. Since pages are always
 * served under a locale prefix (`/en/...`, `/fr/...`), invalidating only the
 * canonical (unprefixed) path would miss the actually-rendered URLs — this
 * iterates `routing.locales` so callers never hand-build locale-prefixed
 * strings themselves.
 */
function revalidateLocalizedPath(
  href: Parameters<typeof getPathname>[0]["href"],
): void {
  routing.locales.forEach((locale: (typeof routing.locales)[number]) => {
    revalidatePath(getPathname({ href, locale }));
  });
}

export { revalidateLocalizedPath };
