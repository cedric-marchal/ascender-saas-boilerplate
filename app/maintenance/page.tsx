import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { MaintenancePage } from "@/components/pages/maintenance-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.errorPages.maintenance");

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function MaintenanceRoute() {
  return <MaintenancePage />;
}
