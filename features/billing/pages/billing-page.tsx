import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { Link } from "@/i18n/navigation";
import { AlertCircle, CreditCard } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";

import { BillingPortalButton } from "@/features/billing/components/billing-portal-button";
import { InvoiceList } from "@/features/billing/components/invoice-list";
import { SubscriptionCard } from "@/features/billing/components/subscription-card";
import { SubscriptionListEmpty } from "@/features/billing/components/subscription-list-empty";
import { SubscriptionStatusCard } from "@/features/billing/components/subscription-status-card";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/features/billing/constants/subscription-status.constant";
import type {
  BillingSubscription,
  GetBillingResult,
} from "@/features/billing/services/get-billing.service";

import { Main } from "@/components/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type BillingPageProps = {
  billing: GetBillingResult;
};

function BillingPage({ billing }: BillingPageProps) {
  const t = useTranslations("billing");
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;
  const { invoices, subscriptions } = billing;

  const activeSubscription = subscriptions.find(
    (subscription: BillingSubscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  const inactiveSubscriptions = subscriptions.filter(
    (subscription: BillingSubscription) =>
      !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <CreditCard
              className="size-5 text-emerald-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
        </div>
        {subscriptions.length > 0 && <BillingPortalButton />}
      </header>

      <Separator />

      {subscriptions.length === 0 && (
        <div className="space-y-6">
          <SubscriptionStatusCard subscriptions={[]} />
          <SubscriptionListEmpty />

          {invoices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t("invoiceHistory")}</h2>
              <InvoiceList invoices={invoices} />
            </div>
          )}

          <div className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/pricing">{t("discoverOffers")}</Link>
            </Button>
          </div>
        </div>
      )}

      {subscriptions.length > 0 && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t("status")}</h2>
              <SubscriptionStatusCard subscriptions={subscriptions} />
            </div>

            {activeSubscription && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  {t("activeSubscription")}
                </h2>
                <SubscriptionCard subscription={activeSubscription} />

                {activeSubscription.cancelAtPeriodEnd && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    <AlertTitle>{t("cancelingTitle")}</AlertTitle>
                    <AlertDescription>
                      {t("cancelingDescription", {
                        date: new Date(
                          activeSubscription.currentPeriodEnd * 1000,
                        ).toLocaleDateString(bcp47, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }),
                      })}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("invoiceHistory")}</h2>
            <InvoiceList invoices={invoices} />
          </div>

          {inactiveSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t("oldSubscriptions")}</h2>

              <div className="grid gap-4">
                {inactiveSubscriptions.map(
                  (subscription: BillingSubscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </Main>
  );
}

export { BillingPage };
