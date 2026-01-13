import Link from "next/link";

function ForgotPasswordLink() {
  return (
    <Link
      href="/mot-de-passe-oublie"
      className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
    >
      Mot de passe oublié ?
    </Link>
  );
}

export { ForgotPasswordLink };
