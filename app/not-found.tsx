import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { NotFoundPage } from "@/components/pages/not-found-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.errorPages.notFound");

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function NotFoundRoute() {
  return <NotFoundPage />;
}
