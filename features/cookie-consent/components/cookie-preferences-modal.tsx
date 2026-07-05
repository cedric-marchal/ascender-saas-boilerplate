"use client";

import { useTranslations } from "next-intl";

import {
  COOKIE_CATEGORIES,
  useCookieConsent,
  type CookieCategoryId,
} from "@/features/cookie-consent/hooks/use-cookie-consent";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

function CookiePreferencesModal() {
  const t = useTranslations("cookieConsent");

  const isPreferencesOpen = useCookieConsent(
    (state) => state.isPreferencesOpen,
  );
  const closePreferences = useCookieConsent((state) => state.closePreferences);
  const preferences = useCookieConsent((state) => state.preferences);
  const updateCategory = useCookieConsent((state) => state.updateCategory);
  const savePreferences = useCookieConsent((state) => state.savePreferences);

  return (
    <Sheet open={isPreferencesOpen} onOpenChange={closePreferences}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t("modal.title")}</SheetTitle>
          <SheetDescription>{t("modal.description")}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            {(Object.keys(COOKIE_CATEGORIES) as CookieCategoryId[]).map(
              (categoryId: CookieCategoryId) => {
                const category = COOKIE_CATEGORIES[categoryId];

                return (
                  <div
                    key={categoryId}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t(`categories.${categoryId}.label`)}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {t(`categories.${categoryId}.description`)}
                      </p>
                    </div>

                    <Switch
                      checked={preferences[categoryId]}
                      disabled={category.required}
                      onCheckedChange={(checked: boolean) =>
                        updateCategory(categoryId, checked)
                      }
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>

        <SheetFooter>
          <Button type="button" onClick={savePreferences} className="w-full">
            {t("modal.saveButton")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { CookiePreferencesModal };
