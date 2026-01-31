import Link from "next/link";

import { Button } from "@/components/ui/button";

type PricingFreeButtonProps = {
  children: string;
};

function PricingFreeButton({ children }: PricingFreeButtonProps) {
  return (
    <Button type="button" variant="outline" className="mt-4 w-full" asChild>
      <Link href="/inscription">{children}</Link>
    </Button>
  );
}

export { PricingFreeButton };
