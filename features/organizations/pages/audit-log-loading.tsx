import { Main } from "@/components/main";
import { Skeleton } from "@/components/ui/skeleton";

function AuditLogLoading() {
  return (
    <Main aria-busy="true" aria-label="Chargement...">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_: unknown, index: number) => (
            <div key={index} className="flex flex-col gap-1 py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      </div>
    </Main>
  );
}

export { AuditLogLoading };
