import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AcceptInvitationPage } from "@/features/organizations/pages/accept-invitation-page";

import { requireSession } from "@/lib/session";

type AcceptInvitationRouteProps = {
  params: Promise<{ locale: string; invitationId: string }>;
};

export async function generateMetadata({
  params,
}: AcceptInvitationRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "organizations.acceptInvitation",
  });

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AcceptInvitationRoute({
  params,
}: AcceptInvitationRouteProps) {
  const { locale, invitationId } = await params;

  setRequestLocale(locale as Locale);

  await requireSession();

  return <AcceptInvitationPage invitationId={invitationId} />;
}
