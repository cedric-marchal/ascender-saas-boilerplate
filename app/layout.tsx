import { Suspense, type ReactNode } from "react";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { routing } from "@/i18n/routing";

import { env } from "@/lib/env";

import { Providers } from "@/app/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Évite le FOIT (Flash of Invisible Text)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Base metadata for the whole app. `openGraph.locale` here is only the
 * fallback for routes rendered outside the `[locale]` segment (maintenance,
 * error boundaries, etc). `app/[locale]/layout.tsx` overrides it per-locale
 * via `LOCALE_METADATA`, using the statically-known `params.locale` — never
 * a dynamic API — so this root layout stays fully static.
 */
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "[Description par défaut du site]",
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME, url: BASE_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: LOCALE_METADATA[routing.defaultLocale].ogLocale,
    siteName: APP_NAME,
    images: [
      {
        url: "/images/open-graph/next-saas-boilerplate-open-graph.webp",
        width: 1200,
        height: 630,
        alt: APP_NAME,
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    // creator: "@votrecompte",
    // site: "@votrecompte",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
