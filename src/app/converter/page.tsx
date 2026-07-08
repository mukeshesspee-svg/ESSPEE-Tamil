"use client";

import { useState } from "react";
import { fontConverter, FontEncoding } from "@/lib/font-converter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";

export default function ConverterPage() {
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [sourceFont, setSourceFont] = useState<FontEncoding>("unicode");
  const [targetFont, setTargetFont] = useState<FontEncoding>("bamini");

  const handleConvert = () => {
    if (!sourceText) return;
    try {
      const converted = fontConverter.convert(sourceText, sourceFont, targetFont);
      setTargetText(converted);
      toast.success("Conversion successful!");
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    }
  };

  const handleSwap = () => {
    setSourceFont(targetFont);
    setTargetFont(sourceFont);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const handleDownload = () => {
    const blob = new Blob([targetText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `converted_${targetFont}.txt`);
    toast.success("File downloaded");
  };

  return (
    <div className="flex flex-col h-full space-y-4 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tamil Font Converter</h1>
        <p className="text-muted-foreground">
          Bidirectional conversion between Unicode, Bamini, TAM, TAB, and other legacy Tamil fonts.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background p-4 border rounded-md shadow-sm">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium mb-1 block">Source Encoding</label>
          <Select value={sourceFont} onValueChange={(v) => setSourceFont(v as FontEncoding)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unicode">Unicode</SelectItem>
              <SelectItem value="bamini">Bamini</SelectItem>
              <SelectItem value="tab">TAB</SelectItem>
              <SelectItem value="tscii">TSCII</SelectItem>
              <SelectItem value="anjal">Anjal</SelectItem>
              <SelectItem value="senthamizh">Senthamizh</SelectItem>
              <SelectItem value="tam">TAM</SelectItem>
              <SelectItem value="suntommy">Sun Tommy</SelectItem>
              <SelectItem value="vanavil">Vanavil Avvaiyar</SelectItem>
              <SelectItem value="ka">Ka</SelectItem>
              <SelectItem value="jeeva">Jeeva</SelectItem>
              <SelectItem value="chenet">Chenet</SelectItem>
              <SelectItem value="lttm">LT-TM</SelectItem>
              <SelectItem value="mcl">MCL Font</SelectItem>
              <SelectItem value="dinak">Dinakaran</SelectItem>
              <SelectItem value="tac">TAC</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="kruti">Kruti Tamil</SelectItem>
              <SelectItem value="inscript">Inscript</SelectItem>
              <SelectItem value="mylai">Mylai</SelectItem>
              <SelectItem value="indoweb">Indoweb</SelectItem>
              <SelectItem value="murasoli">Murasoli</SelectItem>
              <SelectItem value="dinamani">Dinamani</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" className="mt-6 rounded-full" onClick={handleSwap}>
          <ArrowRightLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 w-full">
          <label className="text-sm font-medium mb-1 block">Target Encoding</label>
          <Select value={targetFont} onValueChange={(v) => setTargetFont(v as FontEncoding)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unicode">Unicode</SelectItem>
              <SelectItem value="bamini">Bamini</SelectItem>
              <SelectItem value="tab">TAB</SelectItem>
              <SelectItem value="tscii">TSCII</SelectItem>
              <SelectItem value="anjal">Anjal</SelectItem>
              <SelectItem value="senthamizh">Senthamizh</SelectItem>
              <SelectItem value="tam">TAM</SelectItem>
              <SelectItem value="suntommy">Sun Tommy</SelectItem>
              <SelectItem value="vanavil">Vanavil Avvaiyar</SelectItem>
              <SelectItem value="ka">Ka</SelectItem>
              <SelectItem value="jeeva">Jeeva</SelectItem>
              <SelectItem value="chenet">Chenet</SelectItem>
              <SelectItem value="lttm">LT-TM</SelectItem>
              <SelectItem value="mcl">MCL Font</SelectItem>
              <SelectItem value="dinak">Dinakaran</SelectItem>
              <SelectItem value="tac">TAC</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="kruti">Kruti Tamil</SelectItem>
              <SelectItem value="inscript">Inscript</SelectItem>
              <SelectItem value="mylai">Mylai</SelectItem>
              <SelectItem value="indoweb">Indoweb</SelectItem>
              <SelectItem value="murasoli">Murasoli</SelectItem>
              <SelectItem value="dinamani">Dinamani</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-[400px]">
        {/* Source Textarea */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm text-muted-foreground">Source Text</h3>
            <Button variant="ghost" size="sm" onClick={() => setSourceText("")}>
              <Trash2 className="w-4 h-4 text-destructive mr-2" /> Clear
            </Button>
          </div>
          <Textarea 
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="flex-1 resize-none p-4 font-tamil text-lg"
            placeholder="Paste your source text here..."
          />
        </div>

        {/* Target Textarea */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm text-muted-foreground">Converted Text</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(targetText);
                toast.success("Copied to clipboard");
              }} disabled={!targetText}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!targetText}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </div>
          <Textarea 
            value={targetText}
            readOnly
            className="flex-1 resize-none p-4 font-tamil text-lg bg-muted/30"
            placeholder="Converted text will appear here..."
          />
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={handleConvert} className="w-64">
          Convert Text
        </Button>
      </div>
    </div>
  );
}
