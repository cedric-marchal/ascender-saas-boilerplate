import { useTranslations } from "next-intl";

import { Main } from "@/components/main";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function BillingLoading() {
  const t = useTranslations("billing");

  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label={t("loadingLabel")}
    >
      <header className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
      </header>

      <Separator />

      <section className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />

            <div className="rounded-xl border">
              <div className="space-y-1.5 p-6">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="space-y-4 p-6 pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />

            <div className="rounded-xl border">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="space-y-4 p-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-4" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-56" />

          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index: number) => (
              <div key={index} className="rounded-xl border">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-24" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-3" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Main>
  );
}

export { BillingLoading };
