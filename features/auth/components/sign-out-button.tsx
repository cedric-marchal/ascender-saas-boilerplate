"use client";

import { useRouter } from "next/navigation";

import { signOutAction } from "@/features/auth/actions/sign-out.action";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function SignOutButton() {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(signOutAction);

  async function handleSignOut() {
    try {
      getActionResult(await executeAsync());
      router.push("/connexion");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleSignOut}
      disabled={isExecuting}
      className="cursor-pointer transition hover:opacity-80"
    >
      Déconnexion
    </Button>
  );
}

export { SignOutButton };
