import { Main } from "@/components/main";
import { Skeleton } from "@/components/ui/skeleton";

function UserDetailLoading() {
  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label="Chargement du détail utilisateur"
    >
      <Skeleton className="h-9 w-24" />

      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border py-6">
          <div className="space-y-4 px-6">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 8 }).map((_, index: number) => (
              <div key={index} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border py-6">
          <div className="space-y-4 px-6">
            <Skeleton className="h-5 w-32" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
            {Array.from({ length: 2 }).map((_, index: number) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-56" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border py-6">
        <div className="space-y-4 px-6">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, index: number) => (
            <div key={index} className="flex items-start justify-between py-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border py-6">
        <div className="space-y-4 px-6">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 2 }).map((_, index: number) => (
            <div key={index} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Main>
  );
}

export { UserDetailLoading };
