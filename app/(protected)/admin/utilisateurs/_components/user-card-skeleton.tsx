import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function UserCardSkeleton() {
  return (
    <Card className="border border-gray-200 rounded-md p-4">
      <CardHeader>
        <CardTitle>
          <Skeleton className="w-1/2 h-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </CardContent>
    </Card>
  );
}

export { UserCardSkeleton };
