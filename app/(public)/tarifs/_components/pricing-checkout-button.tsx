"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isResponseError } from "up-fetch";

import { upfetch } from "@/lib/up-fetch";

import { Button } from "@/components/ui/button";

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleCheckout() {
    if (!isAuthenticated) {
      router.push("/inscription");
      return;
    }

    if (!isEmailVerified) {
      toast.error(
        "Vous devez vérifier votre adresse e-mail avant de vous abonner"
      );
      router.push("/dashboard/parametres");
      return;
    }

    if (!isCustomer) {
      toast.error(
        "Seuls les utilisateurs avec le rôle CUSTOMER peuvent souscrire à un abonnement"
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
      if (isResponseError(error)) {
        const body = error.data as { message?: string };
        toast.error(body?.message || "Une erreur est survenue");
      } else {
        toast.error("Une erreur est survenue");
      }
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
