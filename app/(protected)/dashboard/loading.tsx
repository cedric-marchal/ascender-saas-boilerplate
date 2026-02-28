import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
      className="flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-5 w-56" />
    </main>
  );
}
