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

type WelcomeEmailProps = {
  name: string;
  verificationLink: string;
};

function WelcomeEmail({ name, verificationLink }: WelcomeEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur {APP_NAME} - Vérifiez votre adresse email</Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Bienvenue sur {APP_NAME} !
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour {name},
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Merci de vous être inscrit sur {APP_NAME}. Pour activer votre
              compte et accéder à toutes les fonctionnalités, veuillez confirmer
              votre adresse email en cliquant sur le bouton ci-dessous.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={verificationLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                Vérifier mon adresse email
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Ce lien expire dans 24 heures. Si vous n&apos;avez pas créé de
              compte sur {APP_NAME}, vous pouvez ignorer cet email.
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

export { WelcomeEmail };
export type { WelcomeEmailProps };
