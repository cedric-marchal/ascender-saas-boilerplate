import { Building2 } from "lucide-react";

import { organizationsColumns } from "@/features/admin/components/organizations-columns";
import { OrganizationsFilters } from "@/features/admin/components/organizations-filters";
import type { OrganizationRow } from "@/features/admin/services/get-organizations.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

type OrganizationsPageProps = {
  organizations: OrganizationRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

function OrganizationsPage({
  organizations,
  totalCount,
  totalPages,
  currentPage,
}: OrganizationsPageProps) {
  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <Building2 className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Organisations
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalCount} organisation{totalCount > 1 ? "s" : ""} trouvée
              {totalCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <Separator />

      <OrganizationsFilters />

      <section className="space-y-4">
        <DataTable columns={organizationsColumns} data={organizations} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { OrganizationsPage };
