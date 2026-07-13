import { getLocale } from "next-intl/server";

import { NotFoundPage } from "@/components/pages/not-found-page";

export default async function LocaleNotFoundRoute() {
  const locale = await getLocale();

  return <NotFoundPage locale={locale} />;
}
