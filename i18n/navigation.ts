import { routing } from "@/i18n/routing";
import { createNavigation } from "next-intl/navigation";

const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export { getPathname, Link, redirect, usePathname, useRouter };
