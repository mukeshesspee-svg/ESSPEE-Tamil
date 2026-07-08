"use client";

import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  FileText, 
  Mic, 
  Type, 
  ScanText, 
  Wand2, 
  Languages, 
  CopyCheck, 
  Settings, 
  LayoutDashboard 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Document", url: "/editor", icon: FileText },
  { title: "Voice Typing", url: "/voice", icon: Mic },
  { title: "Tanglish Typing", url: "/tanglish", icon: Type },
  { title: "OCR Scanner", url: "/ocr", icon: ScanText },
  { title: "AI Writer", url: "/ai", icon: Wand2 },
  { title: "Font Converter", url: "/converter", icon: Languages },
  { title: "Batch Converter", url: "/batch", icon: CopyCheck },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="py-8 px-4 border-b flex flex-col items-center justify-center bg-primary/5">
        <div className="flex flex-col w-[180px]">
          <Image src="/logo.svg" alt="ESSPEE Logo" width={180} height={180} className="object-contain" />
          <h2 className="text-lg font-extrabold text-right leading-tight text-foreground mt-2">
            Tamil Writer Pro
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* @ts-ignore */}
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="py-5">
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* @ts-ignore */}
                <SidebarMenuButton asChild isActive={pathname === "/settings"} className="py-5">
                  <Link href="/settings" className="flex items-center gap-3 w-full">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <p className="text-xs text-center text-muted-foreground font-medium">
          Created by: Mukesh Paramasivan
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
