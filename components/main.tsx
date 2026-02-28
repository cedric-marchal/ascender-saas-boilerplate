import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type MainProps = ComponentPropsWithoutRef<"main">;

function Main({ children, className, ...props }: MainProps) {
  return (
    <main className={cn(className)} {...props}>
      {children}
    </main>
  );
}

export { Main };
