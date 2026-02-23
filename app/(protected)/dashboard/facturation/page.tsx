import type { Metadata } from "next";

import { BillingView } from "@/features/billing/components/billing-view";
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

export default async function DashboardBillingPage() {
  const session = await requireCustomerVerifiedEmail();

  const billing = await getBilling(session.user.id);

  return <BillingView billing={billing} />;
}
