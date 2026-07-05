import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { UnauthorizedPage } from "@/components/pages/unauthorized-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.errorPages.unauthorized");

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function UnauthorizedRoute() {
  return <UnauthorizedPage />;
}
