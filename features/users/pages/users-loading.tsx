import { Skeleton } from "@/components/ui/skeleton";
import { Main } from "@/components/main";

function UsersLoading() {
  return (
    <Main
      className="flex min-h-screen w-full flex-col gap-6 p-6"
      aria-busy="true"
      aria-label="Chargement de la liste des utilisateurs"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="flex gap-4 border-b p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>

          {Array.from({ length: 10 }).map((_, index: number) => (
            <div key={index} className="flex items-center gap-4 border-b p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </Main>
  );
}

export { UsersLoading };
