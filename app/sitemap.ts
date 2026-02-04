import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * Échelle de priorité SEO standardisée
 * @see https://www.sitemaps.org/protocol.html
 */
const PRIORITY = {
  CRITICAL: 1.0, // Page d'accueil uniquement
  HIGH: 0.9, // Pages de conversion critiques (tarifs, features)
  IMPORTANT: 0.8, // Pages importantes (contact, about)
  MEDIUM: 0.7, // Contenu secondaire (blog, auth)
  LOW: 0.6, // Contenu tertiaire
  MINIMAL: 0.5, // Pages légales, archives
} as const;

type SitemapEntry = {
  path: string;
  changeFrequency: "yearly" | "monthly" | "weekly" | "daily";
  priority: (typeof PRIORITY)[keyof typeof PRIORITY];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  const staticPages: SitemapEntry[] = [
    {
      path: "",
      changeFrequency: "weekly",
      priority: PRIORITY.CRITICAL,
    },
    {
      path: "/tarifs",
      changeFrequency: "monthly",
      priority: PRIORITY.HIGH,
    },
    {
      path: "/contact",
      changeFrequency: "monthly",
      priority: PRIORITY.IMPORTANT,
    },
    {
      path: "/connexion",
      changeFrequency: "monthly",
      priority: PRIORITY.MEDIUM,
    },
    {
      path: "/inscription",
      changeFrequency: "monthly",
      priority: PRIORITY.MEDIUM,
    },
    {
      path: "/mentions-legales",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      path: "/politique-de-confidentialite",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      path: "/politique-des-cookies",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      path: "/conditions-d-utilisation",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
    {
      path: "/conditions-de-vente",
      changeFrequency: "yearly",
      priority: PRIORITY.MINIMAL,
    },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map(
    (page: SitemapEntry) => ({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })
  );

  // 🚀 SECTION: Pages dynamiques (décommentez quand nécessaire)
  // Exemple avec blog posts
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

  // 🚀 SECTION: Autres contenus dynamiques (projets, articles, etc.)
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
