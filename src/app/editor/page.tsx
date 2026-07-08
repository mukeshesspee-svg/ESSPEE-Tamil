"use client";

import { useState, useEffect, useCallback } from "react";
import { RichTextEditor, PageSize, Margins, Orientation } from "@/components/editor/rich-text-editor";
import { LayoutToolbar } from "@/components/editor/layout-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Download, FileDown, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { get, set } from "idb-keyval";
import { saveAs } from "file-saver";
import { asBlob } from "html-docx-js-typescript";

export default function EditorPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Document");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Layout State
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [margins, setMargins] = useState<Margins>('normal');
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadDoc = async () => {
      try {
        const savedDoc = await get("current-doc");
        if (savedDoc) {
          setTitle(savedDoc.title || "Untitled Document");
          setContent(savedDoc.content || "");
        }
      } catch (err) {
        console.error("Failed to load document", err);
      }
    };
    loadDoc();
  }, []);

  const handleBackgroundSave = useCallback(async (currentContent: string, currentTitle: string) => {
    try {
      await set("current-doc", {
        title: currentTitle,
        content: currentContent,
        updatedAt: new Date().toISOString()
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to background save", err);
    }
  }, []);

  const saveToDisk = async () => {
    setIsSaving(true);
    try {
      // 1. Generate DOCX Blob from HTML
      const htmlString = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', sans-serif; font-size: 16px; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
      
      const docxBlob = await asBlob(htmlString, {
        orientation: orientation,
        margins: {
          top: margins === 'narrow' ? 720 : margins === 'wide' ? 1440 : 1080,
          right: margins === 'narrow' ? 720 : margins === 'wide' ? 1440 : 1080,
          bottom: margins === 'narrow' ? 720 : margins === 'wide' ? 1440 : 1080,
          left: margins === 'narrow' ? 720 : margins === 'wide' ? 1440 : 1080,
        }
      });

      const fileName = `${title || "document"}.docx`;

      // 2. Try Native File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Word Document',
              accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          // @ts-ignore
          await writable.write(docxBlob);
          await writable.close();
          toast.success("Document saved successfully!");
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error(err);
            toast.error("Failed to save via File Picker.");
          }
        }
      } else {
        // 3. Fallback to standard download for unsupported browsers
        // @ts-ignore
        saveAs(docxBlob, fileName);
        toast.success("Document downloaded!");
      }

      // Also update background save
      handleBackgroundSave(content, title);
    } catch (err) {
      console.error("Save error", err);
      toast.error("An error occurred while saving the document.");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save debounced effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content || title !== "Untitled Document") {
        handleBackgroundSave(content, title);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, title, handleBackgroundSave]);

  const exportAsTXT = () => {
    try {
      const tempElement = document.createElement("div");
      tempElement.innerHTML = content;
      const text = tempElement.innerText;
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${title || "document"}.txt`);
      toast.success("Exported as TXT");
    } catch (err) {
      toast.error("Failed to export TXT");
    }
  };

  const exportAsPDF = () => {
    // Rely on browser print dialog to generate PDF, preserving styling better than client-side pdf-lib for rich text
    window.print();
    toast.success("Use 'Save as PDF' in the print dialog");
  };

  const exportAsDOCX = () => {
    saveToDisk(); // Now uses the robust saveToDisk implementation
  };

  return (
    <div className="flex flex-col h-full space-y-4 print:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-4 rounded-md border shadow-sm print:hidden">
        <div className="flex items-center gap-4 flex-1">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-xs font-bold text-lg border-transparent hover:border-input focus:border-input px-2"
            placeholder="Document Title"
          />
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-success" />
                Saved {lastSaved.toLocaleTimeString()}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveToDisk}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                As PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsDOCX}>
                <FileDown className="w-4 h-4 mr-2" />
                As Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsTXT}>
                <FileDown className="w-4 h-4 mr-2" />
                As Text (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col min-h-0 print:m-0 print:p-0">
        <div className="print:hidden">
          <LayoutToolbar 
            pageSize={pageSize} setPageSize={setPageSize}
            margins={margins} setMargins={setMargins}
            orientation={orientation} setOrientation={setOrientation}
          />
        </div>
        <RichTextEditor 
          content={content} 
          onChange={setContent} 
          pageSize={pageSize}
          margins={margins}
          orientation={orientation}
        />
      </div>
    </div>
  );
}
