"use client";

import type { ComponentType } from "react";

import Link from "next/link";

import {
  ChevronUp,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { env } from "@/lib/env";

import { SignOutButton } from "@/components/sign-out-button";
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

type MenuItem = {
  title: string;
  url: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items = [
  {
    title: "Tableau de bord",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Utilisateurs",
    url: "/admin/utilisateurs",
    icon: Users,
  },
  {
    title: "Paramètres",
    url: "/admin/parametres",
    icon: Settings,
  },
];

type AdminSidebarProps = {
  image?: string | null;
  name: string;
};

function AdminSidebar({ image, name }: AdminSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span>{env.NEXT_PUBLIC_APP_NAME} - Admin</span>
            </div>
          </SidebarGroupLabel>
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
                        src={`https://pub-72962e5431d34da686d4c668ceaaf669.r2.dev${image}`}
                        alt={`${name} avatar`}
                      />
                    ) : (
                      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span>{name}</span>
                  <ChevronUp className="ml-auto" aria-hidden="true" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <span>Retour à la page principale</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/parametres">
                    <span>Mon compte</span>
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

export { AdminSidebar };
