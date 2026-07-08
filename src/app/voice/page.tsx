"use client";

import { VoiceDictation } from "@/components/voice/voice-dictation";

export default function VoicePage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voice Typing</h1>
        <p className="text-muted-foreground">
          Speak naturally in Tamil and watch it convert to text instantly.
        </p>
      </div>
      <div className="flex-1 w-full flex flex-col min-h-0">
        <VoiceDictation />
      </div>
    </div>
  );
}
