import { getTranslations } from "next-intl/server";

import { AcceptInvitationButton } from "@/features/organizations/components/accept-invitation-button";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AcceptInvitationPageProps = {
  invitationId: string;
};

async function AcceptInvitationPage({
  invitationId,
}: AcceptInvitationPageProps) {
  const t = await getTranslations("organizations.acceptInvitation");

  return (
    <Main className="flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationButton invitationId={invitationId} />
        </CardContent>
      </Card>
    </Main>
  );
}

export { AcceptInvitationPage };
