import Link from "next/link";

function ForgotPasswordLink() {
  return (
    <Link
      href="/mot-de-passe-oublie"
      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      Mot de passe oublié ?
    </Link>
  );
}

export { ForgotPasswordLink };
