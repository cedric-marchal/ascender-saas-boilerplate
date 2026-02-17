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
} from "@react-email/components";

import { env } from "@/lib/env";

type ResetPasswordEmailProps = {
  name: string;
  resetLink: string;
};

function ResetPasswordEmail({ name, resetLink }: ResetPasswordEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

  return (
    <Html>
      <Head />
      <Preview>Réinitialisez votre mot de passe {APP_NAME}</Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Réinitialisation de mot de passe
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour {name},
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Vous avez demandé à réinitialiser votre mot de passe sur{" "}
              {APP_NAME}. Cliquez sur le bouton ci-dessous pour créer un nouveau
              mot de passe.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={resetLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                Réinitialiser mon mot de passe
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Ce lien expire dans 1 heure. Si vous n&apos;avez pas demandé cette
              réinitialisation, vous pouvez ignorer cet email.
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre
              navigateur :
            </Text>
            <Text className="m-0 text-xs break-all text-zinc-500">
              {resetLink}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { ResetPasswordEmail };
export type { ResetPasswordEmailProps };
