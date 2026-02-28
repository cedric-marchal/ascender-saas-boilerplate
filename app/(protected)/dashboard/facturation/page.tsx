import type { Metadata } from "next";

import { BillingEmptyPage } from "@/features/billing/pages/billing-empty-page";
import { BillingPage } from "@/features/billing/pages/billing-page";
import { getBilling } from "@/features/billing/services/get-billing.service";

import { requireCustomerVerifiedEmail } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Facturation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardBillingRoute() {
  const session = await requireCustomerVerifiedEmail();
  const billing = await getBilling(session.user.id);

  if (!billing) {
    return <BillingEmptyPage />;
  }

  return <BillingPage billing={billing} />;
}
