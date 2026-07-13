import { useTranslations } from "next-intl";

import { Main } from "@/components/main";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLoading() {
  const t = useTranslations("dashboard.home");

  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label={t("loadingLabel")}
    >
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index: number) => (
          <div key={index} className="rounded-xl border p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="mt-4 h-32 w-full rounded-lg" />
      </div>
    </Main>
  );
}

export { DashboardLoading };
