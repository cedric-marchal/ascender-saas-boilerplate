"use client";

import { useState } from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { FolderPlus, X } from "lucide-react";

import { CreateProjectForm } from "@/features/projects/components/forms/create-project-form";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function CreateProjectModal() {
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button">
          <FolderPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nouveau projet
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
          <AlertDialogTitle>Nouveau projet</AlertDialogTitle>
          <AlertDialogDescription>
            Créez un nouveau projet pour votre organisation.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <CreateProjectForm onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { CreateProjectModal };
