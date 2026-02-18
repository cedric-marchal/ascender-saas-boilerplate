"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { DeleteAccountForm } from "@/features/account/components/forms/delete-account-form";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Trash2, X } from "lucide-react";

import {
  AlertDialog,
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
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
    router.push("/");
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 h-6 w-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </AlertDialogPrimitive.Cancel>

        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer votre compte</AlertDialogTitle>
          <AlertDialogDescription>
            {showStripeWarning
              ? "Cette action est irréversible. Votre compte, vos données et votre abonnement Stripe seront définitivement supprimés."
              : "Cette action est irréversible. Votre compte et vos données seront définitivement supprimés."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DeleteAccountForm email={email} onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DeleteAccountModal };
