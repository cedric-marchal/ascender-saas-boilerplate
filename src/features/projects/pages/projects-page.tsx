import dynamic from "next/dynamic";

import { FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";

import { projectsColumns } from "@/features/projects/components/projects-columns";
import { ProjectsEmpty } from "@/features/projects/components/projects-empty";
import { ProjectsFilters } from "@/features/projects/components/projects-filters";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

const CreateProjectModal = dynamic(() =>
  import("@/features/projects/components/modals/create-project-modal").then(
    (module) => ({ default: module.CreateProjectModal }),
  ),
);

type ProjectsPageProps = {
  projects: ProjectItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasActiveFilters: boolean;
};

function ProjectsPage({
  projects,
  totalCount,
  totalPages,
  currentPage,
  hasActiveFilters,
}: ProjectsPageProps) {
  const t = useTranslations("projects");

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FolderKanban className="size-5 text-blue-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("projectCount", { count: totalCount })}
            </p>
          </div>
        </div>

        <CreateProjectModal />
      </header>

      <Separator />

      <ProjectsFilters />

      <section className="space-y-4">
        {projects.length > 0 ? (
          <>
            <DataTable columns={projectsColumns} data={projects} />
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        ) : (
          <ProjectsEmpty hasActiveFilters={hasActiveFilters} />
        )}
      </section>
    </Main>
  );
}

export { ProjectsPage };
