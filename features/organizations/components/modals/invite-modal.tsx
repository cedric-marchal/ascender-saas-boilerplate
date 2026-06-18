"use client";

import { useState } from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { UserPlus, X } from "lucide-react";

import { InviteForm } from "@/features/organizations/components/forms/invite-form";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function InviteModal() {
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button">
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Inviter un membre
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
          <AlertDialogTitle>Inviter un membre</AlertDialogTitle>
          <AlertDialogDescription>
            Invitez un collaborateur à rejoindre votre organisation par email.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <InviteForm onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { InviteModal };
