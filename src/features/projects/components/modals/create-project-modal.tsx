"use client";

import { useState } from "react";

import { FolderPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { CreateProjectForm } from "@/features/projects/components/forms/create-project-form";

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

function CreateProjectModal() {
  const t = useTranslations("projects.createModal");
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <FolderPlus className="mr-2 h-4 w-4" aria-hidden="true" />
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
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>

        <CreateProjectForm onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { CreateProjectModal };
