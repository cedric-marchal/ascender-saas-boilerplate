import { FolderKanban } from "lucide-react";

import { CreateProjectModal } from "@/features/projects/components/modals/create-project-modal";
import { projectsColumns } from "@/features/projects/components/projects-columns";
import { ProjectsEmpty } from "@/features/projects/components/projects-empty";
import { ProjectsFilters } from "@/features/projects/components/projects-filters";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

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
  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FolderKanban className="size-5 text-blue-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
            <p className="text-muted-foreground text-sm">
              {totalCount} projet{totalCount > 1 ? "s" : ""}
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
