"use client";

import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((previous: boolean) => !previous)}
        className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-9 w-9 items-center justify-center"
        aria-label={
          isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
