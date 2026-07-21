"use client";

import { useEffect, type ComponentType } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { SignOutButton } from "@/features/auth/components/sign-out-button";

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
  titleKey: "dashboard" | "users" | "settings";
  url: "/admin" | "/admin/users" | "/admin/settings";
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navigationItems: MenuItem[] = [
  {
    titleKey: "dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    titleKey: "users",
    url: "/admin/users",
    icon: Users,
  },
];

const settingsItems: MenuItem[] = [
  {
    titleKey: "settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

type AdminSidebarProps = {
  image?: string | null;
  name: string;
};

function AdminSidebar({ image, name }: AdminSidebarProps) {
  const t = useTranslations("common.adminSidebar");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  function isActive(url: string) {
    if (url === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(url);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/admin" />} size="lg">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Shield className="size-4" aria-hidden="true" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {env.NEXT_PUBLIC_APP_NAME}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {t("tagline")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigationGroup")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isActive(item.url)}
                    tooltip={t(item.titleKey)}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{t(item.titleKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("configurationGroup")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isActive(item.url)}
                    tooltip={t(item.titleKey)}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{t(item.titleKey)}</span>
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
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
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
                  <span className="text-muted-foreground truncate text-xs">
                    {t("adminRole")}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem render={<Link href="/admin/settings" />}>
                  <User className="size-4" aria-hidden="true" />
                  <span>{t("myAccount")}</span>
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

export { AdminSidebar };
