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

type AccountDeletedEmailProps = {
  name: string;
};

function AccountDeletedEmail({ name }: AccountDeletedEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  return (
    <Html>
      <Head />
      <Preview>Votre compte {APP_NAME} a été supprimé</Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Compte supprimé
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Bonjour {name},
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Nous vous confirmons que votre compte {APP_NAME} a été supprimé
              avec succès. Toutes vos données associées ont été définitivement
              supprimées.
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Si vous souhaitez un jour revenir sur {APP_NAME}, vous pouvez
              créer un nouveau compte à tout moment.
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              Si vous n&apos;êtes pas à l&apos;origine de cette suppression ou
              si vous avez des questions, veuillez{" "}
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
              Cet email a été envoyé automatiquement suite à la suppression de
              votre compte. Si vous avez des questions, n&apos;hésitez pas à nous
              contacter.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { AccountDeletedEmail };
export type { AccountDeletedEmailProps };
