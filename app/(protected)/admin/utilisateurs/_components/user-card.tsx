import { CheckCircle2, XCircle } from "lucide-react";

import { USER_ROLE_CONFIG } from "@/lib/constants/user-role.constant";
import type { User as PrismaUser } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { formatDate } from "@/utils/date/format-date";

const ROLE_BADGE_STYLES = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  red: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  gray: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
} as const;

type User = Pick<
  PrismaUser,
  "id" | "image" | "name" | "email" | "emailVerified" | "createdAt" | "role"
>;

type UserCardProps = {
  user: User;
};

function UserCard({ user }: UserCardProps) {
  const roleConfig = USER_ROLE_CONFIG[user.role];
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="leading-none font-semibold">{user.name}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  ROLE_BADGE_STYLES[roleConfig.color]
                )}
              >
                {roleConfig.label}
              </Badge>
            </div>

            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <span>{user.email}</span>
              {user.emailVerified ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-green-600"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="text-muted-foreground/50 h-3.5 w-3.5"
                  aria-hidden="true"
                />
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              Inscrit le {formatDate({ date: user.createdAt })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { UserCard };
export type { User };
