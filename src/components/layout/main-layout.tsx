"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 bg-card m-2 md:m-4 rounded-xl border shadow-sm overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
