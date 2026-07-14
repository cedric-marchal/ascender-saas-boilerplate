import { getLocale } from "next-intl/server";

import { ForbiddenPage } from "@/components/pages/forbidden-page";

export default async function LocaleForbiddenRoute() {
  const locale = await getLocale();

  return <ForbiddenPage locale={locale} />;
}
