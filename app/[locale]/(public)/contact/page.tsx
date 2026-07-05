import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ContactPage } from "@/features/contact/pages/contact-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Contactez l'équipe ${APP_NAME}. Une question, un projet ou un besoin spécifique ? Nous vous répondons sous 24h.`;

export const metadata: Metadata = {
  title: "Contact",
  description: DESCRIPTION,
  keywords: ["contact", APP_NAME.toLowerCase(), "support", "aide", "question"],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `Contact | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/contact",
  },
  twitter: {
    title: `Contact | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type ContactRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactRoute({ params }: ContactRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <ContactPage />;
}
