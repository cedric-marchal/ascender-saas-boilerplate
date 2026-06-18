import { Main } from "@/components/main";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function OrganizationsLoading() {
  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label="Chargement de la liste des organisations"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="flex gap-4 border-b p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>

          {Array.from({ length: 10 }).map((_, index: number) => (
            <div key={index} className="flex items-center gap-4 border-b p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
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

export { OrganizationsLoading };
