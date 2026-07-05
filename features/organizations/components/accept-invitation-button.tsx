"use client";

import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { acceptInvitationAction } from "@/features/organizations/actions/accept-invitation.action";

import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type AcceptInvitationButtonProps = {
  invitationId: string;
};

function AcceptInvitationButton({ invitationId }: AcceptInvitationButtonProps) {
  const router = useRouter();
  const t = useTranslations("organizations.acceptInvitation");
  const { executeAsync, isExecuting } = useAction(acceptInvitationAction);

  async function handleAccept() {
    try {
      getActionResult(await executeAsync({ id: invitationId }));

      toast.success(t("successToast"));
      router.push("/dashboard/organization");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      onClick={handleAccept}
      disabled={isExecuting}
      className="w-full"
    >
      {isExecuting && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {isExecuting ? t("acceptingButton") : t("acceptButton")}
    </Button>
  );
}

export { AcceptInvitationButton };
