"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createPortalSessionAction } from "@/features/billing/actions/create-portal-session.action";

import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function BillingPortalButton() {
  const { executeAsync, isExecuting } = useAction(createPortalSessionAction);

  async function handleOpenPortal() {
    try {
      const data = getActionResult(await executeAsync());

      window.location.href = data.url;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleOpenPortal}
      disabled={isExecuting}
    >
      {isExecuting && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
      {isExecuting ? "Chargement..." : "Gérer mon abonnement"}
    </Button>
  );
}

export { BillingPortalButton };
