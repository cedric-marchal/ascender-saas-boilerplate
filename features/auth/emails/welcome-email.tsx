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

type WelcomeEmailProps = {
  name: string;
  verificationLink: string;
  locale: Locale;
};

function WelcomeEmail({ name, verificationLink, locale }: WelcomeEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const translate = getTranslator(locale);

  return (
    <Html>
      <Head />
      <Preview>
        {translate("emails.welcome.preview", { appName: APP_NAME })}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              {translate("emails.welcome.heading", { appName: APP_NAME })}
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.welcome.greeting", { name })}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.welcome.body", { appName: APP_NAME })}
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={verificationLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                {translate("emails.welcome.cta")}
              </Button>
            </Section>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.welcome.expiry", { appName: APP_NAME })}
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              {translate("emails.welcome.fallbackIntro")}
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
