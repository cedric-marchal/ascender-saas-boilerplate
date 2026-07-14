"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { OrganizationForm } from "@/features/organizations/components/forms/organization-form";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function OrganizationModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const t = useTranslations("organizations.organizationModal");

  function handleSuccess() {
    onOpenChange(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 h-6 w-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
            aria-label={t("closeLabel")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </AlertDialogPrimitive.Cancel>

        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>

        <OrganizationForm onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { OrganizationModal };
