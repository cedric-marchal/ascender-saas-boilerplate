"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
      className="cursor-pointer hover:opacity-80 transition"
    >
      Déconnexion
    </Button>
  );
}

export { SignOutButton };
