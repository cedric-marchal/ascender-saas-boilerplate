import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";
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

type ResetPasswordEmailProps = {
  name: string;
  resetLink: string;
  locale: Locale;
};

function ResetPasswordEmail({
  name,
  resetLink,
  locale,
}: ResetPasswordEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const translate = getTranslator(locale);

  return (
    <Html>
      <Head />
      <Preview>
        {translate("emails.resetPassword.preview", { appName: APP_NAME })}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              {translate("emails.resetPassword.heading")}
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.resetPassword.greeting", { name })}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.resetPassword.body", { appName: APP_NAME })}
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={resetLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                {translate("emails.resetPassword.cta")}
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.resetPassword.expiry")}
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              {translate("emails.resetPassword.fallbackIntro")}
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
