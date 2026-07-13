import type { Route } from "next";
import Link from "next/link";

import { getStaticPathname } from "@/i18n/get-static-pathname";
import { getTranslator } from "@/i18n/get-translator";
import { LogIn } from "lucide-react";
import type { Locale } from "next-intl";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

/*
 * Context-free by design: this page renders both inside `app/[locale]/`
 * (localized 401s) and from the root `app/unauthorized.tsx` (outside
 * `NextIntlClientProvider`), so it must not use `getTranslations` or the
 * `@/i18n/navigation` Link. Locale is passed in; links resolve through
 * `getStaticPathname` and plain `next/link`.
 */
function UnauthorizedPage({ locale }: { locale: Locale }) {
  const translator = getTranslator(locale);

  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="unauthorized-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-500/10">
          <LogIn className="size-8 text-blue-500" aria-hidden="true" />
        </div>

        <h1
          id="unauthorized-title"
          className="text-foreground mb-2 text-4xl font-bold tabular-nums"
        >
          {translator("common.errorPages.unauthorized.code")}
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          {translator("common.errorPages.unauthorized.heading")}
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          {translator("common.errorPages.unauthorized.description")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" asChild>
            <Link href={getStaticPathname("/sign-in", locale) as Route}>
              {translator("common.errorPages.unauthorized.signIn")}
            </Link>
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href={getStaticPathname("/", locale) as Route}>
              {translator("common.errorPages.unauthorized.backHome")}
            </Link>
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { UnauthorizedPage };
