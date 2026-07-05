"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteProjectAction } from "@/features/projects/actions/delete-project.action";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type DeleteProjectModalProps = {
  project: ProjectItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteProjectModal({
  project,
  open,
  onOpenChange,
}: DeleteProjectModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  async function handleDelete() {
    setIsExecuting(true);

    try {
      getActionResult(await deleteProjectAction({ projectId: project.id }));

      toast.success("Projet supprimé avec succès");
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            {`${project.name} sera définitivement supprimé. Cette action est irréversible.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isExecuting}
          >
            {isExecuting ? "Suppression..." : "Supprimer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DeleteProjectModal };
