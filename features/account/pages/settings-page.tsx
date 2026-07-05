import dynamic from "next/dynamic";

import { useTranslations } from "next-intl";

import { AvatarForm } from "@/features/account/components/forms/avatar-form";
import { PasswordForm } from "@/features/account/components/forms/password-form";
import { ProfileForm } from "@/features/account/components/forms/profile-form";
import { SettingsHeader } from "@/features/account/components/settings-header";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DeleteAccountModal = dynamic(() =>
  import("@/features/account/components/modals/delete-account-modal").then(
    (module) => ({ default: module.DeleteAccountModal }),
  ),
);

type SettingsPageProps = {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null | undefined;
  };
  showStripeWarning?: boolean;
};

function SettingsPage({ user, showStripeWarning = false }: SettingsPageProps) {
  const t = useTranslations("account.settings");

  return (
    <Main className="flex flex-col gap-6 p-6">
      <SettingsHeader />

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo.title")}</CardTitle>
              <CardDescription>{t("personalInfo.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                name={user.name}
                email={user.email}
                emailVerified={user.emailVerified}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("security.title")}</CardTitle>
              <CardDescription>{t("security.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("avatarCard.title")}</CardTitle>
              <CardDescription>{t("avatarCard.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarForm name={user.name} image={user.image} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">
            {t("dangerZone.title")}
          </CardTitle>
          <CardDescription className="text-red-600">
            {showStripeWarning
              ? t("dangerZone.descriptionWithSubscription")
              : t("dangerZone.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountModal
            email={user.email}
            showStripeWarning={showStripeWarning}
          />
        </CardContent>
      </Card>
    </Main>
  );
}

export { SettingsPage };
