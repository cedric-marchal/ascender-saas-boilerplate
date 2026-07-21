import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

async function TooManyRequestsPage() {
  const t = await getTranslations("common.errorPages.tooManyRequests");

  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="too-many-requests-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-orange-100">
          <Clock className="size-8 text-orange-600" aria-hidden="true" />
        </div>

        <h1
          id="too-many-requests-title"
          className="text-foreground mb-2 text-4xl font-bold tabular-nums"
        >
          {t("code")}
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          {t("heading")}
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">{t("description")}</p>

        <Button type="button" render={<Link href="/" />}>
          {t("backHome")}
        </Button>
      </div>
    </Main>
  );
}

export { TooManyRequestsPage };
