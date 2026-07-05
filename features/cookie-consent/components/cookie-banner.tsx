"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { Link, usePathname } from "@/i18n/navigation";
import { Cookie, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCookieConsent } from "@/features/cookie-consent/hooks/use-cookie-consent";

import { Button } from "@/components/ui/button";

const CookiePreferencesModal = dynamic(
  () =>
    import("@/features/cookie-consent/components/cookie-preferences-modal").then(
      (module) => ({ default: module.CookiePreferencesModal }),
    ),
  { loading: () => null },
);

function CookieBanner() {
  const t = useTranslations("cookieConsent.banner");
  const pathname = usePathname();

  const [isHydrated, setIsHydrated] = useState(false);

  const hasConsented = useCookieConsent((state) => state.hasConsented);
  const acceptAll = useCookieConsent((state) => state.acceptAll);
  const rejectAll = useCookieConsent((state) => state.rejectAll);
  const openPreferences = useCookieConsent((state) => state.openPreferences);
  const closePreferences = useCookieConsent((state) => state.closePreferences);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);

    const { hasConsented: persisted, preferences } =
      useCookieConsent.getState();

    if (persisted && preferences) {
      useCookieConsent.setState({
        preferences: {
          essential: true,
          functional: Boolean(preferences.functional),
          analytics: Boolean(preferences.analytics),
          marketing: Boolean(preferences.marketing),
        },
        hasConsented: Boolean(persisted),
      });
    }
  }, []);

  useEffect(() => {
    closePreferences();
  }, [pathname, closePreferences]);

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {hasConsented ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("manageAriaLabel")}
          onClick={openPreferences}
          className="fixed right-4 bottom-4 z-50 rounded-full shadow-lg hover:shadow-xl"
        >
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </Button>
      ) : (
        <div
          role="dialog"
          aria-label={t("dialogAriaLabel")}
          className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t shadow-[0_-2px_8px_rgba(0,0,0,0.1)]"
        >
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="mb-4 flex items-start gap-3">
              <Shield
                className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                {t("message")}{" "}
                <Link
                  href="/cookie-policy"
                  className="hover:text-foreground underline"
                >
                  {t("learnMore")}
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={acceptAll}>
                {t("acceptAll")}
              </Button>
              <Button type="button" variant="outline" onClick={rejectAll}>
                {t("rejectAll")}
              </Button>
              <Button type="button" variant="ghost" onClick={openPreferences}>
                {t("managePreferences")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal />
    </>
  );
}

export { CookieBanner };
