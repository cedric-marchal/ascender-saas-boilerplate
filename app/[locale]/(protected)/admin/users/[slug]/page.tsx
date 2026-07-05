import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { UserDetailPage } from "@/features/users/pages/user-detail-page";
import { getUserBySlug } from "@/features/users/services/get-user.service";

import { filterRatelimit } from "@/lib/ratelimit";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

type AdminUserDetailRouteProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: AdminUserDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const user = await getUserBySlug(slug);

  return {
    title: user ? user.name : "Utilisateur introuvable",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminUserDetailRoute({
  params,
}: AdminUserDetailRouteProps) {
  const { locale, slug } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireAdminVerifiedEmail();

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const user = await getUserBySlug(slug);

  if (!user) {
    notFound();
  }

  return <UserDetailPage user={user} />;
}
