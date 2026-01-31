"use client";

import { useState } from "react";

import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleOpenPortal() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Une erreur est survenue");
        return;
      }

      window.location.href = result.data.url;
    } catch (error: unknown) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleOpenPortal}
      disabled={isLoading}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
      {isLoading ? "Chargement..." : "Gérer mon abonnement"}
    </Button>
  );
}

export { BillingPortalButton };
