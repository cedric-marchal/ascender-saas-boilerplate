import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { ForbiddenPage } from "@/components/pages/forbidden-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.errorPages.forbidden");

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function ForbiddenRoute() {
  return <ForbiddenPage />;
}
