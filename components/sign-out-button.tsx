"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { signOut } from "@/lib/auth-client";

function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleSignOut}
      className="cursor-pointer transition hover:opacity-80"
    >
      Déconnexion
    </Button>
  );
}

export { SignOutButton };
