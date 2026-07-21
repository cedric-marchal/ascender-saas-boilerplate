import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

type PricingFreeButtonProps = {
  children: string;
};

function PricingFreeButton({ children }: PricingFreeButtonProps) {
  return (
    <Button
      render={<Link href="/sign-up" />}
      type="button"
      variant="outline"
      className="mt-4 w-full"
    >
      {children}
    </Button>
  );
}

export { PricingFreeButton };
