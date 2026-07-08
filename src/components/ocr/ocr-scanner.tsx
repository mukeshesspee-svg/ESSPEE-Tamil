"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Copy, Trash2, FileImage } from "lucide-react";
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

export function OcrScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState({ current: 0, total: 0 });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [ocrLang, setOcrLang] = useState("tam"); // Default to Tamil only for higher accuracy
  const [extractTamilOnly, setExtractTamilOnly] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [targetFont, setTargetFont] = useState("unicode"); // Default to no conversion
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preprocess image to improve OCR accuracy (Upscaling & Grayscaling)
  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === "application/pdf") {
        // AI Vision can read PDFs directly via base64, so we bypass canvas processing
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(URL.createObjectURL(file));

          // Scale up by 2x to simulate higher DPI which Tesseract prefers
          const scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Optional: We let Tesseract's internal Leptonica handle thresholding, 
          // but giving it a higher resolution image improves its ability to read complex Tamil curves.
          resolve(canvas.toDataURL('image/png'));
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
        
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: processedUrl, languageMode: mode })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Server failed to process AI OCR.");
        }
        
        return data.text;
      } else {
        const worker = await createWorker(ocrLang, 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.floor(m.progress * 100));
            }
          }
        });
        const { data: { text } } = await worker.recognize(processedUrl);
        
        let finalResult = text;
        if (extractTamilOnly) {
          finalResult = finalResult.replace(/[a-zA-Z]/g, '');
          finalResult = finalResult.replace(/[ \t]{2,}/g, ' ').replace(/\n[ \t]*\n+/g, '\n\n').trim();
        }
        
        await worker.terminate();
        return finalResult;
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to extract text from image.");
      return "";
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const hasPdf = selectedFiles.some(f => f.type === "application/pdf");
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
      
      const processedUrl = await preprocessImage(file);
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
    toast.success(`Successfully extracted ${selectedFiles.length} file(s)!`);
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

  const downloadTxt = () => {
    const text = getConvertedText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "ocr-extracted.txt");
  };

  const downloadDocx = async () => {
    const text = getConvertedText();
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => new Paragraph({
          children: [new TextRun({ text: line, font: targetFont !== 'unicode' ? targetFont : undefined })],
        })),
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "ocr-extracted.docx");
  };

  const downloadPdf = () => {
    const text = getConvertedText();
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // jsPDF standard fonts don't support Tamil unicode natively, 
    // but if converted to a legacy font mapped to standard ASCII chars, it works perfectly!
    doc.setFontSize(12);
    if (targetFont !== "unicode") {
       // Note: To render legacy fonts perfectly in PDF, the TTF must be embedded, 
       // but for this implementation we export the ASCII mapped text.
    }
    
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, 20);
    doc.save("ocr-extracted.pdf");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        
        <div className="p-4 border rounded-md bg-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" /> AI OCR Mode (Gemini)
            </h4>
            <div className="flex items-center gap-2">
              <label htmlFor="ai-toggle" className="text-xs font-medium cursor-pointer select-none">
                {useAi ? "Enabled" : "Disabled"}
              </label>
              <Switch
                id="ai-toggle"
                checked={useAi}
                onCheckedChange={setUseAi}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Standard offline OCR struggles with blurry Tamil fonts. Enable AI Mode to use Google Gemini Vision for <strong>near 100% accuracy</strong>, flawless formatting, and intelligent translation. 
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <h3 className="text-lg font-medium">Source Image</h3>
          <div className="flex gap-2">
            <Select value={ocrLang} onValueChange={setOcrLang} disabled={isProcessing}>
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
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
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
              <p className="text-xs mt-2">Supports JPG, PNG, WEBP, PDF</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="text-lg font-medium mb-2 animate-pulse">
                {batchStatus.total > 1 ? `Scanning Page ${batchStatus.current} of ${batchStatus.total}...` : "Scanning..."}
              </div>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{progress}% complete</div>
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
            <label htmlFor="filter-english" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Extract Tamil & Numbers Only (Removes English)
            </label>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Extracted Text</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(result);
              toast.success("Copied to clipboard");
            }} disabled={!result}>
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
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Convert Font:</span>
            <Select value={targetFont} onValueChange={setTargetFont}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unicode">Unicode (Standard)</SelectItem>
                {Object.keys(fontMappings).map(font => (
                  <SelectItem key={font} value={font} className="capitalize">{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button variant="outline" size="sm" onClick={downloadTxt} disabled={!result} className="whitespace-nowrap">
              <FileText className="w-4 h-4 mr-2" /> TXT
            </Button>
            <Button variant="outline" size="sm" onClick={downloadDocx} disabled={!result} className="whitespace-nowrap">
              <FileIcon className="w-4 h-4 mr-2 text-blue-600" /> DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={!result} className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2 text-red-600" /> PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
