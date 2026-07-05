"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

function ForgotPasswordLink() {
  const t = useTranslations("auth.signIn");

  return (
    <Link
      href="/forgot-password"
      className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
    >
      {t("forgotPasswordLink")}
    </Link>
  );
}

export { ForgotPasswordLink };
