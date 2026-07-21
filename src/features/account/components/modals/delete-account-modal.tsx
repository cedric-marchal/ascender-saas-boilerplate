"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { DeleteAccountForm } from "@/features/account/components/forms/delete-account-form";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteAccountModalProps = {
  email: string;
  showStripeWarning?: boolean;
};

function DeleteAccountModal({
  email,
  showStripeWarning = false,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const t = useTranslations("account.deleteAccountModal");
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
    router.push("/");
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("triggerLabel")}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogCancel
          variant="ghost"
          size="icon"
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 h-6 w-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
          aria-label={t("closeLabel")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </AlertDialogCancel>

        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {showStripeWarning
              ? t("descriptionWithSubscription")
              : t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DeleteAccountForm email={email} onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DeleteAccountModal };
