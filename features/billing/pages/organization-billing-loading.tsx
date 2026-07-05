import { useTranslations } from "next-intl";

import { Main } from "@/components/main";
import { Skeleton } from "@/components/ui/skeleton";

function OrganizationBillingLoading() {
  const t = useTranslations("billing");

  return (
    <Main aria-busy="true" aria-label={t("orgLoadingLabel")}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        <Skeleton className="h-16 w-full rounded-lg" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_: unknown, index: number) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </Main>
  );
}

export { OrganizationBillingLoading };
