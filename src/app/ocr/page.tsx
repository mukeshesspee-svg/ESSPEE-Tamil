"use client";

import { OcrScanner } from "@/components/ocr/ocr-scanner";

export default function OcrPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OCR Scanner</h1>
        <p className="text-muted-foreground">
          Extract text from images automatically using local AI. Supports English and Tamil.
        </p>
      </div>
      <div className="flex-1 w-full flex flex-col min-h-0">
        <OcrScanner />
      </div>
    </div>
  );
}
