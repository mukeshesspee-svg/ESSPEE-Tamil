"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Download, FileText, File as FileIcon, WifiOff } from "lucide-react";
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

export function TanglishEditor() {
  const {
    tanglishText: text,
    setTanglishText: setText,
    tanglishTargetFont: targetFont,
    setTanglishTargetFont: setTargetFont,
  } = useEditorStore();
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiError, setApiError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getConvertedText = () => {
    if (targetFont === "unicode") return text;
    const converter = new TamilFontConverter();
    return converter.convert(text, "unicode", targetFont);
  };

  const handleConvertAndCopy = async () => {
    if (!text) {
      toast.error("Nothing to convert!");
      return;
    }
    try {
      await copyToClipboard(getConvertedText());
      toast.success(
        `Copied as ${targetFont === "unicode" ? "Unicode" : targetFont.toUpperCase()}! Paste it in your document.`
      );
    } catch {
      toast.error("Failed to copy. Please select the text manually.");
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please select the text manually.");
    }
  };

  const downloadTxt = () => {
    const output = getConvertedText();
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "tanglish-document.txt");
  };

  const downloadDocx = async () => {
    const output = getConvertedText();
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: output.split("\n").map(
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
    saveAs(blob, "tanglish-document.docx");
  };

  const downloadPdf = () => {
    const output = getConvertedText();
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(output, pageWidth - margin * 2);
    doc.text(lines, margin, 20);
    doc.save("tanglish-document.pdf");
  };

  // Transliterate using Google Input Tools API
  const transliterate = async (word: string): Promise<string> => {
    if (!word.trim() || !/^[a-zA-Z]+$/.test(word)) return word;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per word

      const response = await fetch(
        `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=ta-t-i0-und&num=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data[0] === "SUCCESS") {
        setApiError(false); // API is working again
        return data[1][0][1][0] || word;
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Transliteration failed", err);
      }
      // Set error state to show the offline warning
      setApiError(true);
    }
    return word; // Return original word as fallback so user doesn't lose their typing
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " " || e.key === "Enter") {
      const cursorPosition = e.currentTarget.selectionStart;
      const currentText = text;

      const textBeforeCursor = currentText.substring(0, cursorPosition);
      const words = textBeforeCursor.split(/[\s\n]+/);
      const lastWord = words[words.length - 1];

      if (lastWord && /^[a-zA-Z]+$/.test(lastWord)) {
        setIsTranslating(true);
        const tamilWord = await transliterate(lastWord);
        setIsTranslating(false);

        if (tamilWord !== lastWord) {
          const newText =
            currentText.substring(0, cursorPosition - lastWord.length) +
            tamilWord +
            currentText.substring(cursorPosition);

          setText(newText);

          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = cursorPosition - lastWord.length + tamilWord.length;
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full max-w-5xl mx-auto">
      {/* Network error warning */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-700 dark:text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            <strong>Transliteration unavailable.</strong> The Google Input API is unreachable on
            your current network (VPN, firewall, or network restriction). You can still type Tamil
            Unicode characters directly.
          </span>
        </div>
      )}

      <div className="flex justify-between items-center bg-background p-2 border rounded-md shadow-sm">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {isTranslating && <span className="animate-pulse text-primary font-medium">Translating...</span>}
          {!isTranslating && "Type in Tanglish (e.g., 'vanakkam') and press space."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setText("")}>
            <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Clear
          </Button>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-h-[500px] text-lg font-tamil resize-none p-6 leading-relaxed shadow-sm border"
        placeholder="Type here in English (e.g. vanakkam, nandri, ayya)..."
      />
      <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between mt-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Convert Font:
          </span>
          <Select value={targetFont} onValueChange={(v) => v && setTargetFont(v)}>
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
            onClick={handleConvertAndCopy}
            disabled={!text}
            className="whitespace-nowrap"
          >
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTxt}
            disabled={!text}
            className="whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-2" /> TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDocx}
            disabled={!text}
            className="whitespace-nowrap"
          >
            <FileIcon className="w-4 h-4 mr-2 text-blue-600" /> DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={!text}
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2 text-red-600" /> PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
