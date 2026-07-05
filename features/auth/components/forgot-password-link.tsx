import { Link } from "@/i18n/navigation";

function ForgotPasswordLink() {
  return (
    <Link
      href="/forgot-password"
      className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
    >
      Mot de passe oublié ?
    </Link>
  );
}

export { ForgotPasswordLink };
