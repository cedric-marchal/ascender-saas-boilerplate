"use client";

import { EditProjectForm } from "@/features/projects/components/forms/edit-project-form";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EditProjectModalProps = {
  project: ProjectItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditProjectModal({
  project,
  open,
  onOpenChange,
}: EditProjectModalProps) {
  function handleSuccess() {
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Modifier le projet</AlertDialogTitle>
          <AlertDialogDescription>
            Modifiez les informations de {project.name}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <EditProjectForm project={project} onSuccess={handleSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { EditProjectModal };
