import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

function SubscriptionListEmpty() {
  const t = useTranslations("billing.subscriptionListEmpty");

  return (
    <section className="py-12 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <CreditCard
          className="text-muted-foreground mx-auto h-12 w-12"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{t("title")}</h3>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
      </div>
    </section>
  );
}

export { SubscriptionListEmpty };
