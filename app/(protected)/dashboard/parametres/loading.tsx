import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSettingsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement des paramètres"
      className="flex min-h-screen w-full flex-col gap-6 p-6"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
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

          <div className="rounded-lg border bg-white p-6">
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
          <div className="rounded-lg border bg-white p-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
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
    </main>
  );
}
