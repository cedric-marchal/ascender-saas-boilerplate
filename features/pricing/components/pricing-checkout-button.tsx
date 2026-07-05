"use client";

import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createCheckoutAction } from "@/features/billing/actions/create-checkout.action";

import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type PricingCheckoutButtonProps = {
  priceId: string;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
  children: string;
  featured?: boolean;
};

function PricingCheckoutButton({
  priceId,
  isAuthenticated,
  isEmailVerified,
  isCustomer,
  children,
  featured = false,
}: PricingCheckoutButtonProps) {
  const router = useRouter();
  const t = useTranslations("pricing");

  const { executeAsync, isExecuting } = useAction(createCheckoutAction);

  async function handleCheckout() {
    if (!isAuthenticated) {
      router.push("/sign-up");
      return;
    }

    if (!isEmailVerified) {
      toast.error(t("verifyEmailToast"));
      router.push("/dashboard/settings");
      return;
    }

    if (!isCustomer) {
      toast.error(t("onlyCustomerToast"));
      return;
    }

    try {
      const data = getActionResult(await executeAsync({ priceId }));

      window.location.href = data.url;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant={featured ? "default" : "outline"}
      onClick={handleCheckout}
      disabled={isExecuting}
      className="mt-4 w-full"
    >
      {isExecuting && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {isExecuting ? t("loadingButton") : children}
    </Button>
  );
}

export { PricingCheckoutButton };
