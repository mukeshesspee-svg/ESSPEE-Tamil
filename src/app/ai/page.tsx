"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Trash2, Send, Download, FileText, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { TamilFontConverter } from "@/lib/font-converter";
import { fontMappings } from "@/lib/tamil-converter";

// Reliable clipboard copy with fallback for older/non-HTTPS browsers
const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};

export default function AiWriterPage() {
  const {
    aiPrompt: prompt,
    setAiPrompt: setPrompt,
    aiResult: result,
    setAiResult: setResult,
    aiTone: tone,
    setAiTone: setTone,
    aiTargetFont: targetFont,
    setAiTargetFont: setTargetFont,
    aiLanguage: language,
    setAiLanguage: setLanguage,
  } = useEditorStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAI = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }

    setIsGenerating(true);

    // 30-second timeout so users get a clear error instead of waiting forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, language }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI content");
      }

      let finalText = data.text;
      if (targetFont !== "unicode") {
        const converter = new TamilFontConverter();
        finalText = converter.convert(finalText, "unicode", targetFont);
      }

      setResult(finalText);
      toast.success("Content generated successfully!");
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        toast.error(
          "Request timed out after 30 seconds. Please try again or check your connection."
        );
      } else {
        console.error(err);
        toast.error(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Result is stored in the targetFont format directly

  const handleCopy = async () => {
    try {
      await copyToClipboard(result);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please select the text manually.");
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "ai-content.txt");
  };

  const downloadDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: result.split("\n").map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    font: targetFont !== "unicode" ? targetFont : undefined,
                  }),
                ],
              })
          ),
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "ai-content.docx");
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(result, pageWidth - margin * 2);
    doc.text(lines, margin, 20);
    doc.save("ai-content.pdf");
  };

  return (
    <div className="flex flex-col h-full space-y-4 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" /> AI Writer
        </h1>
        <p className="text-muted-foreground">
          Generate professional Tamil or English content instantly by providing a prompt.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-[500px]">
        {/* Input Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Prompt</h3>
            <div className="flex gap-2">
              <Select value={language} onValueChange={(v) => {
                setLanguage(v);
                if (v === "english") {
                  setTargetFont("unicode");
                } else {
                  setTargetFont("bamini");
                }
              }}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tamil">Tamil Output</SelectItem>
                  <SelectItem value="english">English Output</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tone} onValueChange={(v) => setTone(v || "professional")}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 resize-none"
            placeholder="e.g. Write an application letter in Tamil requesting 2 days of leave..."
            onKeyDown={(e) => {
              // Allow Ctrl+Enter to generate
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isGenerating && prompt) {
                generateAI();
              }
            }}
          />
          <Button onClick={generateAI} disabled={isGenerating || !prompt} className="w-full">
            {isGenerating ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4" /> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Generate Content
              </span>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+Enter</kbd> to generate
          </p>
        </div>

        {/* Output Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">AI Output</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!result}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResult("")} disabled={!result}>
                <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Clear
              </Button>
            </div>
          </div>
          <Textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className={`flex-1 min-h-[400px] text-lg resize-none p-6 leading-relaxed shadow-sm border placeholder:font-sans ${targetFont === 'bamini' ? 'font-bamini' : 'font-tamil'} ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
            placeholder={isGenerating ? "Generating..." : "AI output will appear here. You can edit it manually if needed."}
            readOnly={isGenerating}
          />

          {/* Export Controls */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Convert Font:
              </span>
              <Select value={targetFont} onValueChange={(value) => {
                if (value && result) {
                  try {
                    const converter = new TamilFontConverter();
                    const converted = converter.convert(result, targetFont, value);
                    setResult(converted);
                  } catch (e) {
                    console.error("Conversion error", e);
                  }
                }
                if (value) setTargetFont(value);
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unicode">Unicode (Standard)</SelectItem>
                  {Object.keys(fontMappings).map((font) => (
                    <SelectItem key={font} value={font} className="capitalize">
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTxt}
                disabled={!result}
                className="whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" /> TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocx}
                disabled={!result}
                className="whitespace-nowrap"
              >
                <FileIcon className="w-4 h-4 mr-2 text-blue-600" /> DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPdf}
                disabled={!result}
                className="whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2 text-red-600" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
