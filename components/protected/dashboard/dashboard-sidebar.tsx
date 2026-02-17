"use client";

import type { ComponentType } from "react";

import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  ChevronUp,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import { env } from "@/lib/env";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { getInitials } from "@/utils/string/get-initials";
import { truncateName } from "@/utils/string/truncate";

type MenuItem = {
  title: string;
  url: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items = [
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
};

function DashboardSidebar({ image, name }: DashboardSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{env.NEXT_PUBLIC_APP_NAME}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item: MenuItem) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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
                <SidebarMenuButton>
                  <Avatar>
                    {image ? (
                      <AvatarImage
                        src={`${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${image}`}
                        alt={`${name} avatar`}
                      />
                    ) : (
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span>{truncateName(name)}</span>
                  <ChevronUp className="ml-auto" aria-hidden="true" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parametres">
                    <span>Mon compte</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/facturation">
                    <span>Facturation</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export { DashboardSidebar };
