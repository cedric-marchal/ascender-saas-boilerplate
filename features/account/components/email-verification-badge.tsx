import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type EmailVerificationBadgeProps = {
  isVerified: boolean;
};

function EmailVerificationBadge({ isVerified }: EmailVerificationBadgeProps) {
  if (isVerified) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-200 text-green-700"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Email vérifié
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-orange-200 text-orange-700"
    >
      <XCircle className="h-3 w-3" aria-hidden="true" />
      Email non vérifié
    </Badge>
  );
}

export { EmailVerificationBadge };
