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

type SeatLimitExceededEmailProps = {
  organizationName: string;
  memberCount: number;
  seatCap: number;
  organizationLink: string;
  locale: Locale;
};

function SeatLimitExceededEmail({
  organizationName,
  memberCount,
  seatCap,
  organizationLink,
  locale,
}: SeatLimitExceededEmailProps) {
  const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
  const translate = getTranslator(locale);

  return (
    <Html>
      <Head />
      <Preview>
        {translate("emails.seatLimitExceeded.preview", {
          organizationName,
          appName: APP_NAME,
        })}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              {translate("emails.seatLimitExceeded.heading")}
            </Heading>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.seatLimitExceeded.greeting")}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.seatLimitExceeded.body", {
                organizationName,
                appName: APP_NAME,
                memberCount,
                seatCap,
              })}
            </Text>

            <Text className="text-sm leading-relaxed text-zinc-700">
              {translate("emails.seatLimitExceeded.noRemoval")}
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={organizationLink}
                className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
              >
                {translate("emails.seatLimitExceeded.cta")}
              </Button>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
              {translate("emails.seatLimitExceeded.fallbackIntro")}
            </Text>
            <Text className="m-0 text-xs break-all text-zinc-500">
              {organizationLink}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { SeatLimitExceededEmail };
export type { SeatLimitExceededEmailProps };
