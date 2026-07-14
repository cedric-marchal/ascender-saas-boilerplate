"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { OrganizationModal } from "@/features/organizations/components/modals/organization-modal";
import type { UserOrganizationItem } from "@/features/organizations/services/get-user-organizations.service";

import { organizationAuthClient } from "@/lib/auth-client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getInitials } from "@/utils/string/get-initials";
import { truncateName } from "@/utils/string/truncate";

type OrgSwitcherProps = {
  organizations: UserOrganizationItem[];
  activeOrganizationId: string | null;
};

function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: OrgSwitcherProps) {
  const router = useRouter();
  const t = useTranslations("organizations.orgSwitcher");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (organizations.length === 0) {
    return null;
  }

  const activeOrg = organizations.find(
    (org: UserOrganizationItem) => org.id === activeOrganizationId,
  );

  async function handleSwitch(organizationId: string) {
    const { error } = await organizationAuthClient.setActive({
      organizationId,
    });

    if (error) {
      toast.error(error.message || t("switchErrorToast"));
      return;
    }

    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-2 px-2"
          >
            <Avatar className="size-6 rounded-md">
              <AvatarFallback className="rounded-md text-xs">
                {activeOrg ? (
                  getInitials(activeOrg.name)
                ) : (
                  <Building2 className="size-3" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-left text-sm font-medium">
              {activeOrg ? truncateName(activeOrg.name) : t("fallbackName")}
            </span>
            <ChevronsUpDown
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" side="bottom">
          {organizations.map((org: UserOrganizationItem) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSwitch(org.id)}
              className="gap-2"
            >
              <Avatar className="size-5 rounded-md">
                <AvatarFallback className="rounded-md text-xs">
                  {getInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{truncateName(org.name)}</span>
              {org.id === activeOrganizationId && (
                <Check className="size-4 shrink-0" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{t("createOrganization")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/organization" className="gap-2">
              <Building2 className="size-4" aria-hidden="true" />
              <span>{t("myOrganization")}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrganizationModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
}

export { OrgSwitcher };
