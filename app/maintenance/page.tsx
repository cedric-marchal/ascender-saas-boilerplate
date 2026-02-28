import type { Metadata } from "next";

import { MaintenancePage } from "@/components/pages/maintenance-page";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenanceRoute() {
  return <MaintenancePage />;
}
