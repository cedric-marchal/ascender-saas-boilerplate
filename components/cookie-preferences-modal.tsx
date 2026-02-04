"use client";

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

import {
  COOKIE_CATEGORIES,
  type CookieCategoryId,
  useCookieConsent,
} from "@/hooks/use-cookie-consent";

function CookiePreferencesModal() {
  const isPreferencesOpen = useCookieConsent(
    (state) => state.isPreferencesOpen
  );
  const closePreferences = useCookieConsent((state) => state.closePreferences);
  const preferences = useCookieConsent((state) => state.preferences);
  const updateCategory = useCookieConsent((state) => state.updateCategory);
  const savePreferences = useCookieConsent((state) => state.savePreferences);

  return (
    <Sheet open={isPreferencesOpen} onOpenChange={closePreferences}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Préférences de cookies</SheetTitle>
          <SheetDescription>
            Activez ou désactivez chaque catégorie de cookies. Les cookies
            nécessaires ne peuvent pas être désactivés.
          </SheetDescription>
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
                        {category.label}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {category.description}
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
              }
            )}
          </div>
        </div>

        <SheetFooter>
          <Button type="button" onClick={savePreferences} className="w-full">
            Sauvegarder mes préférences
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { CookiePreferencesModal };
