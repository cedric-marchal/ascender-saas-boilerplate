import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  typedRoutes: true,
  reactCompiler: true,
  logging: isDev
    ? {
        fetches: {
          fullUrl: true,
        },
      }
    : undefined,
  serverExternalPackages: [
    "@prisma/client",
    "@neondatabase/serverless",
    "react-email",
    "sharp",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "stripe",
    "better-auth",
  ],
  experimental: {
    optimizePackageImports: [
      "nuqs",
      "next-safe-action",
      "lucide-react",
      "@tanstack/react-table",
      "@tanstack/react-form",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
      {
        protocol: "https",
        hostname:
          (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "")
            .replace("https://", "")
            .split("/")[0] ?? "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "picsum.photos",
            },
            {
              protocol: "https" as const,
              hostname: "fastly.picsum.photos",
            },
          ]
        : []),
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
