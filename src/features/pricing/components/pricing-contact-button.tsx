import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

type PricingContactButtonProps = {
  children: string;
};

function PricingContactButton({ children }: PricingContactButtonProps) {
  return (
    <Button
      render={<Link href="/contact" />}
      type="button"
      variant="outline"
      className="mt-4 w-full"
    >
      {children}
    </Button>
  );
}

export { PricingContactButton };
