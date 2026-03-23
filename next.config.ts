import type { NextConfig } from "next";

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  typedRoutes: true,
  serverExternalPackages: [
    "@prisma/client",
    "@neondatabase/serverless",
    "@react-email/components",
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
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tooltip",
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
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: false,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
