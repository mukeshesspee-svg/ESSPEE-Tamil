"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileArchive, Trash2, Settings, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { TamilFontConverter } from "@/lib/font-converter";
import { fontMappings } from "@/lib/tamil-converter";

type FileStatus = "pending" | "processing" | "done" | "error";

interface BatchFile {
  file: File;
  status: FileStatus;
}

export default function BatchConverterPage() {
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceFont, setSourceFont] = useState("unicode");
  const [targetFont, setTargetFont] = useState("bamini");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ file: f, status: "pending" as FileStatus }));
      setBatchFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so the same files can be re-added
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (batchFiles.length === 0) return;
    setIsProcessing(true);

    const converter = new TamilFontConverter();
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batchFiles.length; i++) {
      const { file } = batchFiles[i];

      // Mark as processing
      setBatchFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));

      try {
        const rawText = await file.text();

        // Perform the actual conversion
        let convertedText: string;
        if (sourceFont === targetFont) {
          convertedText = rawText; // No conversion needed
        } else {
          convertedText = converter.convert(rawText, sourceFont, targetFont);
        }

        // Use appropriate file extension
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        zip.file(`converted_${baseName}.txt`, convertedText);

        // Mark as done
        setBatchFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
        successCount++;
      } catch (err) {
        console.error(`Failed to convert ${file.name}:`, err);
        // Mark as error
        setBatchFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error" } : f));
        errorCount++;
      }
    }

    if (successCount > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Batch_Converted_${sourceFont}_to_${targetFont}_${new Date().getTime()}.zip`);
      toast.success(`Successfully converted ${successCount} file(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ""}`);
    } else {
      toast.error("All files failed to convert. Please check the files are valid text files.");
    }

    setIsProcessing(false);
  };

  const clearAll = () => {
    setBatchFiles([]);
  };

  const StatusIcon = ({ status }: { status: FileStatus }) => {
    switch (status) {
      case "done": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing": return <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      default: return <FileArchive className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const allFonts = ["unicode", ...Object.keys(fontMappings)];

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch File Converter</h1>
        <p className="text-muted-foreground">
          Upload multiple TXT or HTML files and convert their Tamil font encoding all at once. Download results as a ZIP archive.
        </p>
      </div>

      <div className="bg-background p-6 border rounded-md shadow-sm space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              multiple
              accept=".txt,.html,.htm"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              <Upload className="w-4 h-4 mr-2" /> Select Files
            </Button>
            {batchFiles.length > 0 && (
              <Button variant="outline" onClick={clearAll} disabled={isProcessing}>
                <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Clear All
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {batchFiles.length} file(s) selected
            </span>
          </div>

          {/* Font selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <Select value={sourceFont} onValueChange={(v) => v && setSourceFont(v)} disabled={isProcessing}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="From Font" />
              </SelectTrigger>
              <SelectContent>
                {allFonts.map(font => (
                  <SelectItem key={font} value={font} className="capitalize">
                    {font === "unicode" ? "Unicode (Standard)" : font.charAt(0).toUpperCase() + font.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground font-medium">→</span>

            <Select value={targetFont} onValueChange={(v) => v && setTargetFont(v)} disabled={isProcessing}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="To Font" />
              </SelectTrigger>
              <SelectContent>
                {allFonts.map(font => (
                  <SelectItem key={font} value={font} className="capitalize">
                    {font === "unicode" ? "Unicode (Standard)" : font.charAt(0).toUpperCase() + font.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Warning if same source and target */}
        {sourceFont === targetFont && batchFiles.length > 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            ⚠️ Source and target fonts are the same. Files will be copied without conversion.
          </div>
        )}

        {/* File List */}
        <div className="border rounded-md min-h-[250px] bg-muted/20 p-4">
          {batchFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
              <FileArchive className="w-12 h-12 mb-4" />
              <p>No files uploaded yet.</p>
              <p className="text-xs mt-1">Supports TXT and HTML files</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {batchFiles.map(({ file, status }, index) => (
                <li key={index} className="flex items-center justify-between bg-background p-3 rounded border shadow-sm">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={status} />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                        {status === "done" && <span className="ml-2 text-green-600 font-medium">✓ Converted</span>}
                        {status === "error" && <span className="ml-2 text-destructive font-medium">✗ Failed</span>}
                        {status === "processing" && <span className="ml-2 text-primary font-medium animate-pulse">Converting...</span>}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={isProcessing}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button size="lg" onClick={processBatch} disabled={batchFiles.length === 0 || isProcessing} className="w-52">
            {isProcessing ? (
              <span className="animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Converting...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Convert & Download ZIP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
