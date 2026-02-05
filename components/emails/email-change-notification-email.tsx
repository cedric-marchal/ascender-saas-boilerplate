import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { env } from "@/lib/env";

type EmailChangeNotificationEmailProps = {
  name: string;
};

function EmailChangeNotificationEmail({
  name,
}: EmailChangeNotificationEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  return (
    <Html>
      <Head />
      <Preview>
        Modification d&apos;adresse email demandée sur {APP_NAME}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Modification d&apos;adresse email demandée
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour {name},
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Une demande de modification de votre adresse email sur {APP_NAME}
              a été soumise. Cette modification ne sera effective qu&apos;après
              vérification de la nouvelle adresse.
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Si vous n&apos;êtes pas à l&apos;origine de cette demande,
              veuillez immédiatement{" "}
              <Link
                href={`${BASE_URL}/mot-de-passe-oublie`}
                className="text-zinc-900 underline underline-offset-4"
              >
                réinitialiser votre mot de passe
              </Link>{" "}
              et{" "}
              <Link
                href={`${BASE_URL}/contact`}
                className="text-zinc-900 underline underline-offset-4"
              >
                contacter notre équipe
              </Link>
              .
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              Cet email a été envoyé automatiquement suite à une demande de
              modification d&apos;adresse email. Si vous avez des questions,
              n&apos;hésitez pas à nous contacter.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { EmailChangeNotificationEmail };
export type { EmailChangeNotificationEmailProps };
