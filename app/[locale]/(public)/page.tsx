import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { HomePage } from "@/features/home/pages/home-page";

export const metadata: Metadata = {
  title: "Accueil",
  description: "[Ta description de 150-160 caractères ici]",
  keywords: ["next-saas-boilerplate", "mot-clé-1", "mot-clé-2", "mot-clé-3"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Accueil",
    description: "[Ta description de 150-160 caractères ici]",
    url: "/",
  },
  twitter: {
    title: "Accueil",
    description: "[Ta description de 150-160 caractères ici]",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type HomeRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomeRoute({ params }: HomeRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <HomePage />;
}
