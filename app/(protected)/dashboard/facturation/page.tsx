import type { Metadata } from "next";

import { BillingView, getBilling } from "@/features/billing";

import { requireCustomerVerifiedEmail } from "@/lib/session";

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
