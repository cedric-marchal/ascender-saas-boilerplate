import type { Metadata } from "next";

import { HomePage } from "@/features/home/pages/home-page";

export const metadata: Metadata = {
  title: "Accueil",
  description: "[Ta description de 150-160 caractères ici]",
  keywords: ["ascender-saas-boilerplate", "mot-clé-1", "mot-clé-2", "mot-clé-3"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Accueil",
    description: "[Ta description de 150-160 caractères ici]",
    url: "/",
  },
  twitter: {
    title: "Accueil",
    description: "[Ta description de 150-160 caractères ici]",
  },
};

export default function HomeRoute() {
  return <HomePage />;
}
