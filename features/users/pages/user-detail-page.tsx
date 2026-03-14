import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { subscriptionStatusLabels } from "@/features/billing/constants/subscription-status.constant";
import { roleLabels } from "@/features/users/constants/users-filters.constant";
import type {
  GetUserAccount,
  GetUserResult,
  GetUserSession,
  GetUserSubscription,
} from "@/features/users/services/get-user.service";

import { UserRole } from "@/lib/generated/prisma/browser";

import { Main } from "@/components/main";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getInitials } from "@/utils/string/get-initials";
import { truncateName } from "@/utils/string/truncate";

type UserDetailPageProps = {
  user: GetUserResult;
};

function UserDetailPage({ user }: UserDetailPageProps) {
  return (
    <Main className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/admin/utilisateurs">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour
          </Link>
        </Button>
      </div>

      <header className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {user.image ? (
            <AvatarImage
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${user.image}`}
              alt={`${user.name} avatar`}
            />
          ) : (
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Identifiant</dt>
                <dd className="font-mono text-sm">{user.id}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Slug</dt>
                <dd className="font-mono text-sm">{user.slug}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Nom</dt>
                <dd className="text-sm">{truncateName(user.name)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Email</dt>
                <dd className="text-sm">{user.email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Rôle</dt>
                <dd>
                  <Badge
                    variant={
                      user.role === UserRole.ADMIN ? "default" : "secondary"
                    }
                  >
                    {roleLabels[user.role]}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Email vérifié</dt>
                <dd>
                  <Badge variant={user.emailVerified ? "default" : "outline"}>
                    {user.emailVerified ? "Vérifié" : "Non vérifié"}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Inscrit le</dt>
                <dd className="text-sm">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(user.createdAt))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground text-sm">Mis à jour le</dt>
                <dd className="text-sm">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(user.updatedAt))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Abonnements
              {user.stripeCustomer && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  ({user.stripeCustomer.subscriptions.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!user.stripeCustomer ? (
              <p className="text-muted-foreground text-sm">
                Aucun client Stripe associé
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground text-sm">
                    Stripe ID
                  </span>
                  <span className="font-mono text-sm">
                    {user.stripeCustomer.stripeCustomerId}
                  </span>
                </div>

                {user.stripeCustomer.subscriptions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Aucun abonnement
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {user.stripeCustomer.subscriptions.map(
                      (subscription: GetUserSubscription) => (
                        <li
                          key={subscription.id}
                          className="space-y-2 rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-xs">
                              {subscription.stripeSubscriptionId}
                            </span>
                            <Badge variant="outline">
                              {subscriptionStatusLabels[subscription.status]}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground space-y-1 text-xs">
                            <p>Prix: {subscription.stripePriceId}</p>
                            <p>
                              Période:{" "}
                              {new Intl.DateTimeFormat("fr-FR", {
                                dateStyle: "short",
                              }).format(
                                new Date(subscription.currentPeriodStart),
                              )}{" "}
                              →{" "}
                              {new Intl.DateTimeFormat("fr-FR", {
                                dateStyle: "short",
                              }).format(
                                new Date(subscription.currentPeriodEnd),
                              )}
                            </p>
                            {subscription.cancelAtPeriodEnd && (
                              <p className="text-destructive">
                                Annulation en fin de période
                              </p>
                            )}
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Sessions
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({user.sessions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune session</p>
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
                        <p className="text-muted-foreground text-xs">
                          IP: {session.ipAddress}
                        </p>
                      )}
                      {session.userAgent && (
                        <p className="text-muted-foreground max-w-md truncate text-xs">
                          {session.userAgent}
                        </p>
                      )}
                    </div>
                    <div className="text-muted-foreground shrink-0 space-y-1 text-right text-xs">
                      <p>
                        Créée le{" "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(session.createdAt))}
                      </p>
                      <p>
                        Expire le{" "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(session.expiresAt))}
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
        <CardHeader>
          <CardTitle>
            Comptes liés
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({user.accounts.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun compte lié</p>
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
                      {new Intl.DateTimeFormat("fr-FR", {
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
