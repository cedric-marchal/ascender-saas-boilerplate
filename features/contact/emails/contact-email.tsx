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
          <Container className="mx-auto my-10 max-w-xl rounded-md border border-zinc-200 bg-white p-8">
            <Heading className="m-0 mb-6 text-xl font-semibold text-zinc-900">
              Nouveau message de contact
            </Heading>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Nom
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{name}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Email
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{email}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Sujet
              </Text>
              <Text className="m-0 text-sm text-zinc-900">{subject}</Text>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Section className="mb-4">
              <Text className="m-0 mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Message
              </Text>
              <Text className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">
                {message}
              </Text>
            </Section>

            <Hr className="my-6 border-zinc-200" />

            <Text className="m-0 text-xs text-zinc-500">
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
