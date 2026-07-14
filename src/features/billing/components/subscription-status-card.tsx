import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";

import { getPlanLabel } from "@/features/billing/constants/plan.constant";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
} from "@/features/billing/constants/subscription-status.constant";
import type { BillingSubscription } from "@/features/billing/services/get-billing.service";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SubscriptionStatusCardProps = {
  subscriptions: BillingSubscription[];
};

function SubscriptionStatusCard({
  subscriptions,
}: SubscriptionStatusCardProps) {
  const t = useTranslations("billing");
  const tCard = useTranslations("billing.subscriptionStatusCard");
  const tStatuses = useTranslations("billing.subscriptionStatuses");
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;

  const activeSubscription = subscriptions.find(
    (subscription: BillingSubscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  const planLabel = activeSubscription
    ? (getPlanLabel(activeSubscription.priceId) ?? t("planUnknown"))
    : null;

  const isSubscribed = !!activeSubscription;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tCard("title")}</CardTitle>
        <CardDescription>{tCard("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{tCard("statusLabel")}</p>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <>
                  <CheckCircle2
                    className="h-5 w-5 text-green-600"
                    aria-hidden="true"
                  />
                  <span className="text-lg font-semibold text-green-600">
                    {tCard("subscribed")}
                  </span>
                </>
              ) : (
                <>
                  <XCircle
                    className="text-muted-foreground h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-lg font-semibold">
                    {tCard("notSubscribed")}
                  </span>
                </>
              )}
            </div>
          </div>

          {isSubscribed && planLabel && (
            <Badge variant="default" className="text-base">
              {tCard("planPrefix", { plan: planLabel })}
            </Badge>
          )}
        </div>

        {isSubscribed && activeSubscription && (
          <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {tCard("typeLabel")}
                </span>
                <span className="font-medium">
                  {tStatuses(
                    subscriptionStatusLabels[activeSubscription.status],
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {tCard("renewalLabel")}
                </span>
                <span className="font-medium">
                  {new Date(
                    activeSubscription.currentPeriodEnd * 1000,
                  ).toLocaleDateString(bcp47, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              {activeSubscription.cancelAtPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {tCard("cancellationLabel")}
                  </span>
                  <span className="text-destructive font-medium">
                    {tCard("endOfPeriod")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SubscriptionStatusCard };
