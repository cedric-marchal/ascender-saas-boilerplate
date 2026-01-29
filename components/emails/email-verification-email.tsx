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

type EmailVerificationEmailProps = {
  name: string;
  verificationLink: string;
};

function EmailVerificationEmail({
  name,
  verificationLink,
}: EmailVerificationEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

  return (
    <Html>
      <Head />
      <Preview>Vérifiez votre adresse email {APP_NAME}</Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Vérification de votre adresse email
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour {name},
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Vous avez récemment modifié votre adresse email sur {APP_NAME}.
              Pour des raisons de sécurité, veuillez vérifier votre nouvelle
              adresse email en cliquant sur le bouton ci-dessous.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={verificationLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                Vérifier mon email
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Ce lien expire dans 24 heures. Si vous n&apos;avez pas modifié
              votre email, contactez-nous immédiatement.
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre
              navigateur :
            </Text>
            <Text className="m-0 text-xs break-all text-zinc-500">
              {verificationLink}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { EmailVerificationEmail };
export type { EmailVerificationEmailProps };
