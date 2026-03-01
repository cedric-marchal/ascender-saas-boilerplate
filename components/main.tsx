import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type MainProps = ComponentPropsWithoutRef<"main">;

function Main({ children, className, ...props }: MainProps) {
  return (
    <main
      className={cn("bg-background min-h-screen w-full pb-24", className)}
      {...props}
    >
      {children}
    </main>
  );
}

export { Main };
