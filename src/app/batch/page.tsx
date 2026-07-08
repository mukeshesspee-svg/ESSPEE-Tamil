"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileArchive, Trash2, Settings, Download } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function BatchConverterPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFont, setTargetFont] = useState("unicode");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      
      for (const file of files) {
        // Read the file (For this demo, we only process text-based files properly)
        const text = await file.text();
        
        // Mock conversion logic for batch files
        const convertedText = `[Converted to ${targetFont}]\n\n` + text;
        
        // Add to zip
        zip.file(`converted_${file.name}`, convertedText);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Batch_Converted_${new Date().getTime()}.zip`);
      
      toast.success("Batch conversion complete!");
    } catch (err) {
      toast.error("An error occurred during batch processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch File Converter</h1>
        <p className="text-muted-foreground">
          Upload multiple DOCX, TXT, or HTML files and convert their fonts all at once. Download as a ZIP archive.
        </p>
      </div>

      <div className="bg-background p-6 border rounded-md shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input 
              type="file" 
              multiple 
              accept=".txt,.html,.docx,.rtf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              <Upload className="w-4 h-4 mr-2" /> Select Files
            </Button>
            <span className="text-sm text-muted-foreground">
              {files.length} file(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <Select value={targetFont} onValueChange={(v) => setTargetFont(v || "unicode")} disabled={isProcessing}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Target Encoding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unicode">To Unicode</SelectItem>
                <SelectItem value="bamini">To Bamini</SelectItem>
                <SelectItem value="tam">To TAM</SelectItem>
                <SelectItem value="tab">To TAB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File List */}
        <div className="border rounded-md min-h-[250px] bg-muted/20 p-4">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
              <FileArchive className="w-12 h-12 mb-4" />
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-background p-3 rounded border shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileArchive className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
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
          <Button size="lg" onClick={processBatch} disabled={files.length === 0 || isProcessing} className="w-48">
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Convert & Download
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
