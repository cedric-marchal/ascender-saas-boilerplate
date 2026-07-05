import { getStaticPathname } from "@/i18n/get-static-pathname";
import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";
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
} from "react-email";

import { env } from "@/lib/env";

type PasswordChangedEmailProps = {
  name: string;
  locale: Locale;
};

function PasswordChangedEmail({ name, locale }: PasswordChangedEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
  const translate = getTranslator(locale);
  const forgotPasswordLink = `${BASE_URL}${getStaticPathname("/forgot-password", locale)}`;
  const contactLink = `${BASE_URL}${getStaticPathname("/contact", locale)}`;

  return (
    <Html>
      <Head />
      <Preview>
        {translate("emails.passwordChanged.preview", { appName: APP_NAME })}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              {translate("emails.passwordChanged.heading")}
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.passwordChanged.greeting", { name })}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.passwordChanged.body", {
                appName: APP_NAME,
              })}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.passwordChanged.warningIntro")}{" "}
              <Link
                href={forgotPasswordLink}
                className="text-zinc-900 underline underline-offset-4"
              >
                {translate("emails.passwordChanged.resetPasswordLink")}
              </Link>{" "}
              {translate("emails.passwordChanged.and")}{" "}
              <Link
                href={contactLink}
                className="text-zinc-900 underline underline-offset-4"
              >
                {translate("emails.passwordChanged.contactLink")}
              </Link>
              .
            </Text>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              {translate("emails.passwordChanged.footer")}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { PasswordChangedEmail };
export type { PasswordChangedEmailProps };
