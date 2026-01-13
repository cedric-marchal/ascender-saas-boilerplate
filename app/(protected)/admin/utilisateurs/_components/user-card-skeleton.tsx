import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function UserCardSkeleton() {
  return (
    <Card className="rounded-md border border-gray-200 p-4">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-1/2" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export { UserCardSkeleton };
