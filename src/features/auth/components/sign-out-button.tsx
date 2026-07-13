"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { signOutAction } from "@/features/auth/actions/sign-out.action";

import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type SignOutButtonProps = {
  variant?: "button" | "inline";
};

function SignOutButton({ variant = "button" }: SignOutButtonProps) {
  const router = useRouter();
  const t = useTranslations("common.signOut");
  const { executeAsync, isExecuting } = useAction(signOutAction);

  async function handleSignOut() {
    try {
      getActionResult(await executeAsync());
      router.push("/sign-in");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  if (variant === "inline") {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={handleSignOut}
        onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            handleSignOut();
          }
        }}
        className={isExecuting ? "pointer-events-none opacity-50" : ""}
      >
        {t("button")}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleSignOut}
      disabled={isExecuting}
      className="cursor-pointer transition hover:opacity-80"
    >
      {t("button")}
    </Button>
  );
}

export { SignOutButton };
