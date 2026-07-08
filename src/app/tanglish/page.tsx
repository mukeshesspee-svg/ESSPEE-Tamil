"use client";

import { TanglishEditor } from "@/components/tanglish/tanglish-editor";

export default function TanglishPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tanglish Typing</h1>
        <p className="text-muted-foreground">
          Type in English and press space to magically convert it to Tamil.
        </p>
      </div>
      <div className="flex-1 w-full flex flex-col min-h-0">
        <TanglishEditor />
      </div>
    </div>
  );
}
