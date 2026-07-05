import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";

import { CopyrightYear } from "@/components/public/copyright-year";
import { Separator } from "@/components/ui/separator";

async function Footer() {
  const t = await getTranslations("common.footer");

  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                {env.NEXT_PUBLIC_APP_NAME.charAt(0)}
              </div>
              <span className="text-sm font-semibold tracking-tight">
                {env.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("tagline", { appName: env.NEXT_PUBLIC_APP_NAME })}
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">
                {t("navigationTitle")}
              </h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("contact")}
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">{t("accountTitle")}</h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/sign-up"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("signUp")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-in"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("signIn")}
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">{t("legalTitle")}</h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/legal-notice"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("legalNotice")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("privacyPolicy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("cookiePolicy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("termsOfService")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-sale"
                    className="hover:text-foreground transition-colors"
                  >
                    {t("termsOfSale")}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <p>
            &copy; <CopyrightYear /> {env.NEXT_PUBLIC_APP_NAME}.{" "}
            {t("copyright")}
          </p>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              {t("contact")}
            </Link>
            <Link
              href="/sitemap-page"
              className="hover:text-foreground transition-colors"
            >
              {t("sitemap")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
