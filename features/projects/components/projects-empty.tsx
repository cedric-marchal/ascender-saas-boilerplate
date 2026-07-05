import { FolderKanban } from "lucide-react";

type ProjectsEmptyProps = {
  hasActiveFilters: boolean;
};

function ProjectsEmpty({ hasActiveFilters }: ProjectsEmptyProps) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center text-sm">
      <FolderKanban className="size-8" aria-hidden="true" />
      {hasActiveFilters ? (
        <p>Aucun projet ne correspond à vos filtres.</p>
      ) : (
        <p>Aucun projet pour le moment. Créez votre premier projet.</p>
      )}
    </div>
  );
}

export { ProjectsEmpty };
