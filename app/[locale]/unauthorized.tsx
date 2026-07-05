import { getLocale } from "next-intl/server";

import { UnauthorizedPage } from "@/components/pages/unauthorized-page";

export default async function LocaleUnauthorizedRoute() {
  const locale = await getLocale();

  return <UnauthorizedPage locale={locale} />;
}
