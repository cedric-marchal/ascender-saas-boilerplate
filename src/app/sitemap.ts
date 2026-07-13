import type { MetadataRoute } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { env } from "@/lib/env";

/**
 * Standardized SEO priority scale
 * @see https://www.sitemaps.org/protocol.html
 */
const PRIORITY = {
  CRITICAL: 1.0, // Home page only
  HIGH: 0.9, // Critical conversion pages (pricing, features)
  IMPORTANT: 0.8, // Important pages (contact, about)
  MEDIUM: 0.7, // Secondary content (blog, auth)
  LOW: 0.6, // Tertiary content
  MINIMAL: 0.5, // Legal pages, archives
} as const;

type SitemapPage = {
  href:
    | "/"
    | "/pricing"
    | "/contact"
    | "/sign-in"
    | "/sign-up"
    | "/legal-notice"
    | "/privacy-policy"
    | "/cookie-policy"
    | "/terms-of-service"
    | "/terms-of-sale"
    | "/sitemap-page";
  changeFrequency: "yearly" | "monthly" | "weekly" | "daily";
  priority: (typeof PRIORITY)[keyof typeof PRIORITY];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  const staticPages: SitemapPage[] = [
    {
      href: "/",
      changeFrequency: "weekly",
      priority: PRIORITY.CRITICAL,
    },
    {
      href: "/pricing",
      changeFrequency: "monthly",
      priority: PRIORITY.HIGH,
    },
    {
      href: "/contact",
      changeFrequency: "monthly",
      priority: PRIORITY.IMPORTANT,
    },
    {
      href: "/sign-in",
      changeFrequency: "monthly",
      priority: PRIORITY.MEDIUM,
    },
    {
      href: "/sign-up",
      changeFrequency: "monthly",
      priority: PRIORITY.MEDIUM,
    },
    {
      href: "/legal-notice",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      href: "/privacy-policy",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      href: "/cookie-policy",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      href: "/terms-of-service",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      href: "/terms-of-sale",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      href: "/sitemap-page",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
  ];

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap(
    (locale: (typeof routing.locales)[number]) =>
      staticPages.map((page: SitemapPage) => ({
        url: `${BASE_URL}${getPathname({ href: page.href, locale })}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: getLocaleAlternates(page.href, locale).languages,
        },
      })),
  );

  // 🚀 SECTION: Dynamic pages (uncomment when needed)
  // Example with blog posts
  // const blogPosts = await prisma.post.findMany({
  //   where: { published: true },
  //   select: { slug: true, updatedAt: true },
  //   orderBy: { updatedAt: "desc" },
  // });
  //
  // const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
  //   url: `${BASE_URL}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: PRIORITY.MEDIUM,
  // }));

  // 🚀 SECTION: Other dynamic content (projects, articles, etc.)
  // const projects = await prisma.project.findMany({
  //   where: { published: true },
  //   select: { slug: true, updatedAt: true },
  // });
  //
  // const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
  //   url: `${BASE_URL}/projets/${project.slug}`,
  //   lastModified: project.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: PRIORITY.LOW,
  // }));

  return [
    ...staticEntries,
    // ...blogEntries,
    // ...projectEntries,
  ];
}
