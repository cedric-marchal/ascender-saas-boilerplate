import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/connexion", "/inscription"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
