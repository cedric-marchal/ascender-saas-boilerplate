import { Main } from "@/components/main";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsLoading() {
  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label="Chargement des paramètres"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </header>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border p-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border p-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <Skeleton className="size-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-56" />
      </div>
    </Main>
  );
}

export { SettingsLoading };
