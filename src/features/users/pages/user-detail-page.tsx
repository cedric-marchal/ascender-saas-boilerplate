import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  CreditCard,
  Globe,
  KeyRound,
  MonitorSmartphone,
  UserCircle,
} from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";

import { roleLabels } from "@/features/users/constants/users-filters.constant";
import type {
  GetUserAccount,
  GetUserResult,
  GetUserSession,
} from "@/features/users/services/get-user.service";

import { UserRole } from "@/lib/generated/prisma/browser";

import { Main } from "@/components/main";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getAvatarUrl } from "@/utils/string/get-avatar-url";
import { getInitials } from "@/utils/string/get-initials";
import { truncate, truncateName } from "@/utils/string/truncate";

type UserDetailPageProps = {
  user: GetUserResult;
};

function UserDetailPage({ user }: UserDetailPageProps) {
  const t = useTranslations("admin.userDetail");
  const tRoles = useTranslations("admin.users.roles");
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;

  return (
    <Main className="flex flex-col gap-6 p-6">
      <div>
        <Button
          render={<Link href="/admin/users" />}
          type="button"
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          {t("backButton")}
        </Button>
      </div>

      <header className="flex items-center gap-4">
        <Avatar className="size-14 rounded-lg">
          {user.image ? (
            <AvatarImage
              src={getAvatarUrl(user.image)}
              alt={`${user.name} avatar`}
            />
          ) : (
            <AvatarFallback className="rounded-lg text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.name}
            </h1>
            <Badge
              variant={user.role === UserRole.ADMIN ? "default" : "secondary"}
            >
              {tRoles(roleLabels[user.role])}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </header>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <UserCircle
              className="text-muted-foreground size-5"
              aria-hidden="true"
            />
            <CardTitle>{t("generalInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.id")}
                </dt>
                <dd className="font-mono text-xs">{user.id}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.slug")}
                </dt>
                <dd className="font-mono text-xs">{user.slug}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.name")}
                </dt>
                <dd className="text-sm">{truncateName(user.name)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.email")}
                </dt>
                <dd className="text-sm">{truncate(user.email, 40)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.emailVerified")}
                </dt>
                <dd>
                  <Badge variant={user.emailVerified ? "default" : "outline"}>
                    {user.emailVerified
                      ? t("generalInfo.verified")
                      : t("generalInfo.unverified")}
                  </Badge>
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.createdAt")}
                </dt>
                <dd className="text-sm">
                  {new Intl.DateTimeFormat(bcp47, {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(user.createdAt))}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">
                  {t("generalInfo.updatedAt")}
                </dt>
                <dd className="text-sm">
                  {new Intl.DateTimeFormat(bcp47, {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(user.updatedAt))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CreditCard
              className="text-muted-foreground size-5"
              aria-hidden="true"
            />
            <div>
              <CardTitle>{t("billing.title")}</CardTitle>
              <CardDescription>{t("billing.description")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-24 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("billing.notice")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <MonitorSmartphone
            className="text-muted-foreground size-5"
            aria-hidden="true"
          />
          <div>
            <CardTitle>{t("sessions.title")}</CardTitle>
            <CardDescription>
              {t("sessions.count", { count: user.sessions.length })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {user.sessions.length === 0 ? (
            <div className="text-muted-foreground flex h-16 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("sessions.empty")}
            </div>
          ) : (
            <ul className="divide-y">
              {user.sessions.map((session: GetUserSession) => (
                <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground font-mono text-xs">
                        {session.id}
                      </p>
                      {session.ipAddress && (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Globe className="size-3" aria-hidden="true" />
                          {session.ipAddress}
                        </div>
                      )}
                      {session.userAgent && (
                        <p className="text-muted-foreground text-xs">
                          {truncate(session.userAgent, 120)}
                        </p>
                      )}
                    </div>
                    <div className="text-muted-foreground shrink-0 space-y-1 text-right text-xs">
                      <p>
                        {t("sessions.createdOn", {
                          date: new Intl.DateTimeFormat(bcp47, {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(session.createdAt)),
                        })}
                      </p>
                      <p>
                        {t("sessions.expiresOn", {
                          date: new Intl.DateTimeFormat(bcp47, {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(session.expiresAt)),
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <KeyRound
            className="text-muted-foreground size-5"
            aria-hidden="true"
          />
          <div>
            <CardTitle>{t("accounts.title")}</CardTitle>
            <CardDescription>
              {t("accounts.count", { count: user.accounts.length })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {user.accounts.length === 0 ? (
            <div className="text-muted-foreground flex h-16 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("accounts.empty")}
            </div>
          ) : (
            <ul className="divide-y">
              {user.accounts.map((account: GetUserAccount) => (
                <li key={account.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium capitalize">
                        {account.providerId}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {account.accountId}
                      </p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {new Intl.DateTimeFormat(bcp47, {
                        dateStyle: "short",
                      }).format(new Date(account.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Main>
  );
}

export { UserDetailPage };
