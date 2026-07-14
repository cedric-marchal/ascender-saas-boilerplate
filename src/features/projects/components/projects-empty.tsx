import { FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";

type ProjectsEmptyProps = {
  hasActiveFilters: boolean;
};

function ProjectsEmpty({ hasActiveFilters }: ProjectsEmptyProps) {
  const t = useTranslations("projects.empty");

  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center text-sm">
      <FolderKanban className="size-8" aria-hidden="true" />
      {hasActiveFilters ? <p>{t("filtered")}</p> : <p>{t("unfiltered")}</p>}
    </div>
  );
}

export { ProjectsEmpty };
