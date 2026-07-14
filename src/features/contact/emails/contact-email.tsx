import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";
import {
  Body,
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

type ContactEmailProps = {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: Locale;
};

function ContactEmail({
  name,
  email,
  subject,
  message,
  locale,
}: ContactEmailProps) {
  const translate = getTranslator(locale);

  return (
    <Html>
      <Head />
      <Preview>
        {translate("emails.contact.preview", { name, subject })}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              {translate("emails.contact.heading")}
            </Heading>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {translate("emails.contact.nameLabel")}
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{name}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {translate("emails.contact.emailLabel")}
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{email}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {translate("emails.contact.subjectLabel")}
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{subject}</Text>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {translate("emails.contact.messageLabel")}
              </Text>
              <Text className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">
                {message}
              </Text>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              {translate("emails.contact.footer", { name })}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { ContactEmail };
export type { ContactEmailProps };
