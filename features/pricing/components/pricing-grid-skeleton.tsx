import { Skeleton } from "@/components/ui/skeleton";

function PricingGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index: number) => (
        <div key={index} className="space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-1">
            <Skeleton className="h-8 w-28" />
          </div>

          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((__, featureIndex: number) => (
              <li key={featureIndex}>
                <Skeleton className="h-4 w-full" />
              </li>
            ))}
          </ul>

          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export { PricingGridSkeleton };
