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
          <Container className="mx-auto max-w-xl bg-white border border-zinc-200 rounded-md p-8 my-10">
            <Heading className="text-xl font-semibold text-zinc-900 m-0 mb-6">
              Réinitialisation de mot de passe
            </Heading>

            <Text className="text-sm text-zinc-700 leading-relaxed">
              Bonjour {name},
            </Text>

            <Text className="text-sm text-zinc-700 leading-relaxed">
              Vous avez demandé à réinitialiser votre mot de passe sur{" "}
              {APP_NAME}. Cliquez sur le bouton ci-dessous pour créer un nouveau
              mot de passe.
            </Text>

            <Section className="text-center my-8">
              <Button
                href={resetLink}
                className="bg-zinc-900 text-white text-sm font-medium px-6 py-3 rounded-md"
              >
                Réinitialiser mon mot de passe
              </Button>
            </Section>

            <Text className="text-sm text-zinc-700 leading-relaxed">
              Ce lien expire dans 1 heure. Si vous n&apos;avez pas demandé cette
              réinitialisation, vous pouvez ignorer cet email.
            </Text>

            <Hr className="border-zinc-200 my-6" />

            <Text className="text-xs text-zinc-500 m-0">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre
              navigateur :
            </Text>
            <Text className="text-xs text-zinc-500 m-0 break-all">
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
