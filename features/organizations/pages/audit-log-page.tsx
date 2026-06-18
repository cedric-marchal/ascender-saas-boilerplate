import { Activity } from "lucide-react";

import type { AuditLogItem } from "@/features/organizations/services/get-audit-log.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { Separator } from "@/components/ui/separator";

type AuditLogPageProps = {
  entries: AuditLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

function AuditLogPage({
  entries,
  totalCount,
  totalPages,
  currentPage,
}: AuditLogPageProps) {
  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <Activity className="text-primary size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Journal d&apos;activité
          </h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} événement{totalCount > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <Separator />

      <section className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucune activité enregistrée pour le moment.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry: AuditLogItem) => (
              <li key={entry.id} className="flex flex-col gap-1 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{entry.action}</span>
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="text-muted-foreground text-xs"
                  >
                    {entry.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="text-muted-foreground text-xs">
                  Par {entry.user.name} ({entry.user.email}) ·{" "}
                  {entry.entityType}
                  {entry.entityId !== null && ` · ${entry.entityId}`}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { AuditLogPage };
