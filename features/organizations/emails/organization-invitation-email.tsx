import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { env } from "@/lib/env";

type OrganizationInvitationEmailProps = {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  acceptLink: string;
};

function OrganizationInvitationEmail({
  inviterName,
  inviterEmail,
  organizationName,
  role,
  acceptLink,
}: OrganizationInvitationEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} vous invite à rejoindre {organizationName} sur {APP_NAME}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Vous avez été invité à rejoindre {organizationName}
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour,
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {inviterName} ({inviterEmail}) vous invite à rejoindre
              l&apos;organisation <strong>{organizationName}</strong> sur{" "}
              {APP_NAME} en tant que <strong>{role}</strong>.
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Cliquez sur le bouton ci-dessous pour accepter l&apos;invitation.
              Ce lien est valable 48 heures.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={acceptLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                Accepter l&apos;invitation
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Si vous n&apos;attendiez pas cette invitation, vous pouvez ignorer
              cet email.
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre
              navigateur :
            </Text>
            <Text className="m-0 text-xs break-all text-zinc-500">
              {acceptLink}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { OrganizationInvitationEmail };
export type { OrganizationInvitationEmailProps };
