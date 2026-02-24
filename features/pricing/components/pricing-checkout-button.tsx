"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { upfetch } from "@/lib/up-fetch";

import { Button } from "@/components/ui/button";

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

  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    if (!isAuthenticated) {
      router.push("/inscription");
      return;
    }

    if (!isEmailVerified) {
      toast.error(
        "Vous devez vérifier votre adresse e-mail avant de vous abonner",
      );
      router.push("/dashboard/parametres");
      return;
    }

    if (!isCustomer) {
      toast.error(
        "Seuls les utilisateurs avec le rôle CUSTOMER peuvent souscrire à un abonnement",
      );
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("priceId", priceId);

      const result = await upfetch("/api/stripe/checkout", {
        method: "POST",
        body: formData,
      });

      window.location.href = result.data.url;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={featured ? "default" : "outline"}
      onClick={handleCheckout}
      disabled={isLoading}
      className="mt-4 w-full"
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {isLoading ? "Chargement..." : children}
    </Button>
  );
}

export { PricingCheckoutButton };
