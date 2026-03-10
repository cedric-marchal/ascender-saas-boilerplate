import { Main } from "@/components/main";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLoading() {
  return (
    <Main
      className="flex flex-col px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-5 w-56" />
    </Main>
  );
}

export { DashboardLoading };
