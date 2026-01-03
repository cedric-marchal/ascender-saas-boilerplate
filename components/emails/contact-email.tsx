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
} from "@react-email/components";

type ContactEmailProps = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function ContactEmail({ name, email, subject, message }: ContactEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Nouveau message de {name} : {subject}
      </Preview>
      <Tailwind>
        <Body className="bg-zinc-100 font-sans">
          <Container className="mx-auto max-w-xl bg-white border border-zinc-200 rounded-md p-8 my-10">
            <Heading className="text-xl font-semibold text-zinc-900 m-0 mb-6">
              Nouveau message de contact
            </Heading>

            <Section className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 m-0 mb-1">
                Nom
              </Text>
              <Text className="text-sm text-zinc-900 m-0">{name}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 m-0 mb-1">
                Email
              </Text>
              <Text className="text-sm text-zinc-900 m-0">{email}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 m-0 mb-1">
                Sujet
              </Text>
              <Text className="text-sm text-zinc-900 m-0">{subject}</Text>
            </Section>

            <Hr className="border-zinc-200 my-6" />

            <Section className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 m-0 mb-1">
                Message
              </Text>
              <Text className="text-sm text-zinc-900 m-0 whitespace-pre-wrap leading-relaxed">
                {message}
              </Text>
            </Section>

            <Hr className="border-zinc-200 my-6" />

            <Text className="text-xs text-zinc-500 m-0">
              Vous pouvez répondre directement à cet email pour contacter {name}
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export { ContactEmail };
export type { ContactEmailProps };
