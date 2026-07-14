import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

type PricingContactButtonProps = {
  children: string;
};

function PricingContactButton({ children }: PricingContactButtonProps) {
  return (
    <Button type="button" variant="outline" className="mt-4 w-full" asChild>
      <Link href="/contact">{children}</Link>
    </Button>
  );
}

export { PricingContactButton };
