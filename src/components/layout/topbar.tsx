"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <ThemeToggle />
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
