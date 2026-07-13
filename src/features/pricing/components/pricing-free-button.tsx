import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

type PricingFreeButtonProps = {
  children: string;
};

function PricingFreeButton({ children }: PricingFreeButtonProps) {
  return (
    <Button type="button" variant="outline" className="mt-4 w-full" asChild>
      <Link href="/sign-up">{children}</Link>
    </Button>
  );
}

export { PricingFreeButton };
