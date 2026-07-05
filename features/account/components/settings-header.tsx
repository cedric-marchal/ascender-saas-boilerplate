import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

function SettingsHeader() {
  const t = useTranslations("account.settings");

  return (
    <header className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <Settings className="text-primary size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>
    </header>
  );
}

export { SettingsHeader };
