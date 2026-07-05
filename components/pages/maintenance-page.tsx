import { getTranslator } from "@/i18n/get-translator";
import { Construction } from "lucide-react";
import type { Locale } from "next-intl";

import { Main } from "@/components/main";

/*
 * Context-free by design: `app/maintenance/page.tsx` lives OUTSIDE
 * `app/[locale]/` (proxy.ts redirects every request to `/maintenance` while
 * `MAINTENANCE_ENABLED` is set, before locale negotiation runs), so this page
 * must not use `getTranslations` (no request-config locale available).
 * Locale is passed in, derived from the `NEXT_LOCALE` cookie.
 */
function MaintenancePage({ locale }: { locale: Locale }) {
  const translator = getTranslator(locale);

  return (
    <Main className="flex items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-orange-100">
          <Construction className="size-8 text-orange-600" aria-hidden="true" />
        </div>

        <h1 className="text-foreground mb-3 text-2xl font-semibold">
          {translator("common.errorPages.maintenance.heading")}
        </h1>

        <p className="text-muted-foreground text-sm">
          {translator("common.errorPages.maintenance.description")}
        </p>
      </div>
    </Main>
  );
}

export { MaintenancePage };
