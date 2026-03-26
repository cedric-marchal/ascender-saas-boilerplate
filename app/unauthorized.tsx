import type { Metadata } from "next";

import { UnauthorizedPage } from "@/components/pages/unauthorized-page";

export const metadata: Metadata = {
  title: "Authentification requise - 401",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnauthorizedRoute() {
  return <UnauthorizedPage />;
}
