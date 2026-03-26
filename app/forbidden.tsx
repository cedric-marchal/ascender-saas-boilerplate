import type { Metadata } from "next";

import { ForbiddenPage } from "@/components/pages/forbidden-page";

export const metadata: Metadata = {
  title: "Accès interdit - 403",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForbiddenRoute() {
  return <ForbiddenPage />;
}
