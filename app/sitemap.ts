import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  const staticPages = [
    "",
    "/tarifs",
    "/fonctionnalites",
    "/contact",
    "/mentions-legales",
    "/politique-de-confidentialite",
  ];

  return staticPages.map((path: string) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
