import {
  getHomeOrganizationSchema,
  getHomeWebsiteSchema,
} from "@/features/home/constants/home-seo.constant";

import { Main } from "@/components/main";

function HomePage() {
  const websiteSchema = getHomeWebsiteSchema();
  const organizationSchema = getHomeOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <Main className="bg-background flex items-center justify-center">
        <h1 className="text-2xl font-bold">Hello World</h1>
      </Main>
    </>
  );
}

export { HomePage };
