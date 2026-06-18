"use client";

import { useEffect, type ComponentType } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Building2,
  ChevronsUpDown,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Rocket,
  Settings,
  User,
} from "lucide-react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { OrgSwitcher } from "@/features/organizations/components/org-switcher";
import type { UserOrganizationItem } from "@/features/organizations/services/get-user-organizations.service";

import { env } from "@/lib/env";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

import { getAvatarUrl } from "@/utils/string/get-avatar-url";
import { getInitials } from "@/utils/string/get-initials";
import { truncateName } from "@/utils/string/truncate";

type MenuItem = {
  title: string;
  url:
    | "/dashboard"
    | "/dashboard/projets"
    | "/dashboard/facturation"
    | "/dashboard/parametres"
    | "/dashboard/organisation";
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navigationItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projets",
    url: "/dashboard/projets",
    icon: FolderKanban,
  },
];

const managementItems: MenuItem[] = [
  {
    title: "Organisation",
    url: "/dashboard/organisation",
    icon: Building2,
  },
  {
    title: "Facturation",
    url: "/dashboard/facturation",
    icon: CreditCard,
  },
  {
    title: "Paramètres",
    url: "/dashboard/parametres",
    icon: Settings,
  },
];

type DashboardSidebarProps = {
  image?: string | null;
  name: string;
  organizations: UserOrganizationItem[];
  activeOrganizationId: string | null;
};

function DashboardSidebar({
  image,
  name,
  organizations,
  activeOrganizationId,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  function isActive(url: string) {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(url);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Rocket className="size-4" aria-hidden="true" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {env.NEXT_PUBLIC_APP_NAME}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    Tableau de bord
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {organizations.length >= 2 && (
        <>
          <div className="px-2 pb-1">
            <OrgSwitcher
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
            />
          </div>
          <SidebarSeparator />
        </>
      )}
      {organizations.length < 2 && <SidebarSeparator />}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    {image ? (
                      <AvatarImage
                        src={getAvatarUrl(image)}
                        alt={`${name} avatar`}
                      />
                    ) : (
                      <AvatarFallback className="rounded-lg">
                        {getInitials(name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {truncateName(name)}
                    </span>
                  </div>
                  <ChevronsUpDown
                    className="ml-auto size-4"
                    aria-hidden="true"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parametres">
                    <User className="size-4" aria-hidden="true" />
                    <span>Mon compte</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/facturation">
                    <CreditCard className="size-4" aria-hidden="true" />
                    <span>Facturation</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="size-4" aria-hidden="true" />
                  <SignOutButton variant="inline" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { DashboardSidebar };
