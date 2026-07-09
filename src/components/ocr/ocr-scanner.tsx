"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Copy, Trash2, FileImage, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createWorker } from "tesseract.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Sparkles, Download, FileText, File as FileIcon } from "lucide-react";
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

export function OcrScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState({ current: 0, total: 0 });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [ocrLang, setOcrLang] = useState("tam");
  const [extractTamilOnly, setExtractTamilOnly] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [targetFont, setTargetFont] = useState("unicode");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect if a file looks like a mobile photo (large dimensions, JPEG from camera)
  const isMobilePhoto = (file: File, img: HTMLImageElement): boolean => {
    const isCameraFormat = file.type === "image/jpeg" || file.type === "image/heic";
    const isLargeImage = img.width > 2000 || img.height > 2000;
    return isCameraFormat && isLargeImage;
  };

  // Preprocess image: smart resize + grayscale + contrast enhancement for best OCR
  const preprocessImage = async (file: File, showMobileWarning = false): Promise<{ url: string; isMobile: boolean }> => {
    return new Promise((resolve) => {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: e.target?.result as string, isMobile: false });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve({ url: URL.createObjectURL(file), isMobile: false });

          const mobilePhoto = isMobilePhoto(file, img);

          let targetWidth = img.width;
          let targetHeight = img.height;

          // Scale up very small images for better OCR accuracy
          if (targetWidth < 1000 && targetHeight < 1000) {
            targetWidth *= 2;
            targetHeight *= 2;
          }

          // Scale down very large images (mobile photos) to stay under API limits.
          // 2000px max dimension is more than sufficient for OCR accuracy.
          const MAX_DIM = 2000;
          if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / targetWidth, MAX_DIM / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Apply grayscale + contrast boost BEFORE drawing for Tesseract.
          // This drastically improves accuracy on real-world photos by making
          // text dark and background bright regardless of lighting conditions.
          if (!useAi) {
            ctx.filter = "grayscale(100%) contrast(160%) brightness(110%)";
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Reset filter for any subsequent draws
          ctx.filter = "none";

          // JPEG at 0.9 quality = excellent OCR accuracy + reasonable file size
          resolve({ url: canvas.toDataURL("image/jpeg", 0.9), isMobile: mobilePhoto });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processImageText = async (processedUrl: string): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    try {
      if (useAi) {
        let mode = ocrLang;
        if (extractTamilOnly && ocrLang === "eng+tam") mode = "eng+tam-filtered";

        // 30-second timeout for the AI OCR request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Image: processedUrl, languageMode: mode }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Server failed to process AI OCR.");
          }

          return data.text;
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === "AbortError") {
            throw new Error(
              "Request timed out after 30 seconds. The server took too long. Please try again with a smaller image or check your connection."
            );
          }
          throw fetchErr;
        }
      } else {
        const worker = await createWorker(ocrLang, 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.floor(m.progress * 100));
            }
          },
        });
        const {
          data: { text },
        } = await worker.recognize(processedUrl);

        let finalResult = text;
        if (extractTamilOnly) {
          finalResult = finalResult.replace(/[a-zA-Z]/g, "");
          finalResult = finalResult
            .replace(/[ \t]{2,}/g, " ")
            .replace(/\n[ \t]*\n+/g, "\n\n")
            .trim();
        }

        await worker.terminate();
        return finalResult;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to extract text from image.");
      return "";
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const hasPdf = selectedFiles.some((f) => f.type === "application/pdf");
    if (hasPdf && !useAi) {
      toast.error("PDF scanning requires AI Mode. Please enable AI OCR Mode first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setBatchStatus({ current: 1, total: selectedFiles.length });
    let cumulativeResult = result ? result + "\n\n" : "";

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setBatchStatus({ current: i + 1, total: selectedFiles.length });

      const displayUrl = URL.createObjectURL(file);
      setFileType(file.type);
      setImage(displayUrl);

      const { url: processedUrl, isMobile } = await preprocessImage(file);

      // If this is a mobile photo and user is NOT using AI mode, warn them
      if (isMobile && !useAi && i === 0) {
        toast.warning(
          "📸 Mobile photo detected! For best results, enable AI OCR Mode above. Offline mode struggles with camera photos due to lighting and angles.",
          { duration: 6000 }
        );
      }

      const text = await processImageText(processedUrl);

      if (text) {
        if (selectedFiles.length > 1) {
          cumulativeResult += `--- Page ${i + 1} ---\n\n${text}\n\n`;
        } else {
          cumulativeResult += text;
        }
        setResult(cumulativeResult);
      }
    }

    setBatchStatus({ current: 0, total: 0 });
    if (cumulativeResult) {
      toast.success(`Successfully extracted ${selectedFiles.length} file(s)!`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearImage = () => {
    setImage(null);
    setFileType(null);
    setResult("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConvertedText = () => {
    if (targetFont === "unicode") return result;
    const converter = new TamilFontConverter();
    return converter.convert(result, "unicode", targetFont);
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(result);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please select the text manually.");
    }
  };

  const downloadTxt = () => {
    const text = getConvertedText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "ocr-extracted.txt");
  };

  const downloadDocx = async () => {
    const text = getConvertedText();
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: text.split("\n").map(
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
    saveAs(blob, "ocr-extracted.docx");
  };

  const downloadPdf = () => {
    const text = getConvertedText();
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, 20);
    doc.save("ocr-extracted.pdf");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        {/* AI Mode Toggle */}
        <div className={`p-4 border rounded-md shadow-sm ${useAi ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" /> AI OCR Mode (Gemini)
            </h4>
            <div className="flex items-center gap-2">
              <label htmlFor="ai-toggle" className="text-xs font-medium cursor-pointer select-none">
                {useAi ? "Enabled" : "Disabled"}
              </label>
              <Switch id="ai-toggle" checked={useAi} onCheckedChange={setUseAi} />
            </div>
          </div>
          {useAi ? (
            <p className="text-xs text-muted-foreground">
              ✅ AI Mode is ON. Gemini Vision will handle mobile photos, shadows, angles, and blurry text with <strong>near 100% accuracy</strong>. Also supports PDF scanning.
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ <strong>Offline mode is ON.</strong> This works well for clean, flat, scanned documents. For <strong>mobile camera photos</strong> (angled, shadows, real-world lighting), please <strong>enable AI Mode</strong> above for accurate results.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <h3 className="text-lg font-medium">Source Image</h3>
          <div className="flex gap-2">
            <Select
              value={ocrLang}
              onValueChange={(v) => v && setOcrLang(v)}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tam">Tamil Only (Best)</SelectItem>
                <SelectItem value="eng">English Only</SelectItem>
                <SelectItem value="eng+tam">Tamil + English</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
            {image && (
              <Button variant="destructive" onClick={handleClearImage} disabled={isProcessing}>
                <Trash2 className="w-4 h-4 mr-2" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[400px] border rounded-md border-dashed flex items-center justify-center bg-muted/20 relative overflow-hidden">
          {image ? (
            fileType === "application/pdf" ? (
              <object data={image} type="application/pdf" className="w-full h-full rounded-md" />
            ) : (
              <img src={image} alt="Uploaded for OCR" className="max-w-full max-h-full object-contain" />
            )
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center p-6">
              <FileImage className="w-12 h-12 mb-4 opacity-50" />
              <p>Upload a document containing Tamil or English text</p>
              <p className="text-xs mt-2">Supports JPG, PNG, WEBP, PDF (AI Mode)</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="text-lg font-medium mb-2 animate-pulse">
                {batchStatus.total > 1
                  ? `Scanning Page ${batchStatus.current} of ${batchStatus.total}...`
                  : "Scanning..."}
              </div>
              {!useAi && (
                <>
                  <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{progress}% complete</div>
                </>
              )}
              {useAi && (
                <div className="text-sm text-muted-foreground mt-1">Sending to Gemini AI...</div>
              )}
            </div>
          )}
        </div>

        {ocrLang === "eng+tam" && (
          <div className="flex items-center space-x-2 mt-2 bg-muted/30 p-3 rounded-md border">
            <input
              type="checkbox"
              id="filter-english"
              checked={extractTamilOnly}
              onChange={(e) => setExtractTamilOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="filter-english"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Extract Tamil & Numbers Only (Removes English)
            </label>
          </div>
        )}
      </div>

      {/* Output Column */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Extracted Text</h3>
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
          className="flex-1 min-h-[400px] text-lg font-tamil resize-none p-6 leading-relaxed bg-background"
          placeholder="Extracted text will appear here. You can edit it manually if needed."
        />

        {/* Export Controls */}
        <div className="mt-2 p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
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
  );
}
