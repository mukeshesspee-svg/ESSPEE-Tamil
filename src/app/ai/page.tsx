"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Trash2, Send, Download, FileText, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { TamilFontConverter } from "@/lib/font-converter";
import { fontMappings } from "@/lib/tamil-converter";

export default function AiWriterPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState("professional");
  const [targetFont, setTargetFont] = useState("unicode");

  const generateAI = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI content");
      }
      
      setResult(data.text);
      toast.success("Content generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
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
    saveAs(blob, "ai-content.txt");
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
    saveAs(blob, "ai-content.docx");
  };

  const downloadPdf = () => {
    const text = getConvertedText();
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
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
          Generate professional Tamil content instantly by providing a prompt in English or Tamil.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-[500px]">
        {/* Input Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Prompt</h3>
            <Select value={tone} onValueChange={(v) => setTone(v || "professional")}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="simple">Simple Tamil</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 resize-none"
            placeholder="e.g. Write an application letter in Tamil requesting 2 days of leave..."
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
        </div>

        {/* Output Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">AI Output</h3>
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
          <div className={`flex-1 border rounded-md p-4 bg-background relative overflow-y-auto ${isGenerating ? 'opacity-50' : ''}`}>
            {result ? (
              <div className="font-tamil leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                AI output will appear here
              </div>
            )}
          </div>

          {/* Export Controls */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Convert Font:</span>
              <Select value={targetFont} onValueChange={(value) => value && setTargetFont(value)}>
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
    </div>
  );
}
