import type { Metadata } from "next";

import { NotFoundPage } from "@/components/pages/not-found-page";

export const metadata: Metadata = {
  title: "Page introuvable - 404",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundPage />;
}
