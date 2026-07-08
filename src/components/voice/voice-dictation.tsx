"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Copy, Trash2, Languages, Type, Download, FileText, File as FileIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertUnicodeToLegacy } from "@/lib/tamil-converter";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { TamilFontConverter } from "@/lib/font-converter";
import { fontMappings } from "@/lib/tamil-converter";

export function VoiceDictation() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("ta-IN");
  const [targetFont, setTargetFont] = useState("unicode");
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentSessionFinal = "";
        let currentSessionInterim = "";
        
        for (let i = 0; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentSessionFinal += transcriptText;
          } else {
            currentSessionInterim += transcriptText;
          }
        }
        
        // Always combine the text that existed before this session started, 
        // with the finalized text of this session, plus any in-progress words.
        setTranscript(finalTranscriptRef.current + currentSessionFinal + currentSessionInterim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access blocked! Please click the lock icon in the browser address bar to allow it.");
        } else if (event.error !== "no-speech") {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          // Sync the ref with the newly finalized text before restarting
          finalTranscriptRef.current = transcript;
          try {
            recognitionRef.current.start();
          } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
          }
        }
      };
    } else {
      toast.error("Your browser does not support Voice Dictation.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice dictation is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
    } else {
      // Sync the ref with the current text area value in case user typed manually
      finalTranscriptRef.current = transcript;
      recognitionRef.current.lang = language;
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
        toast.success("Listening started...");
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.message?.includes('not allowed')) {
          toast.error("Microphone access denied. Please click the lock icon in your address bar and 'Allow' the microphone.");
        } else {
          toast.error("Microphone is busy or blocked.");
        }
      }
    }
  };

  const getConvertedText = () => {
    if (targetFont === "unicode") return transcript;
    const converter = new TamilFontConverter();
    return converter.convert(transcript, "unicode", targetFont);
  };

  const handleConvertAndCopy = () => {
    if (!transcript) {
      toast.error("No text to convert.");
      return;
    }
    const resultText = getConvertedText();
    navigator.clipboard.writeText(resultText);
    toast.success(`Copied as ${targetFont === 'unicode' ? 'Unicode' : targetFont.toUpperCase()}! Paste it in your document.`);
  };

  const downloadTxt = () => {
    const output = getConvertedText();
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "voice-transcript.txt");
  };

  const downloadDocx = async () => {
    const output = getConvertedText();
    const doc = new Document({
      sections: [{
        properties: {},
        children: output.split('\n').map(line => new Paragraph({
          children: [new TextRun({ text: line, font: targetFont !== 'unicode' ? targetFont : undefined })],
        })),
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "voice-transcript.docx");
  };

  const downloadPdf = () => {
    const output = getConvertedText();
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(output, pageWidth - margin * 2);
    doc.text(lines, margin, 20);
    doc.save("voice-transcript.pdf");
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full max-w-5xl mx-auto pb-8">
      <div className="sticky top-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border rounded-md shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant={isListening ? "destructive" : "default"} 
            size="lg" 
            onClick={toggleListening}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <div>
            <h3 className="font-medium">{isListening ? "Listening..." : "Click microphone to start"}</h3>
            <p className="text-xs text-muted-foreground">Speak clearly into your microphone.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(v) => setLanguage(v || "ta-IN")} disabled={isListening}>
            <SelectTrigger className="w-[180px]">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ta-IN">Tamil (India)</SelectItem>
              <SelectItem value="ta-LK">Tamil (Sri Lanka)</SelectItem>
              <SelectItem value="ta-MY">Tamil (Malaysia)</SelectItem>
              <SelectItem value="ta-SG">Tamil (Singapore)</SelectItem>
              <SelectItem value="en-IN">English (India)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => {
            navigator.clipboard.writeText(transcript);
            toast.success("Copied to clipboard");
          }}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            setTranscript("");
            finalTranscriptRef.current = "";
          }}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      <Textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        className="flex-1 min-h-[500px] text-lg font-tamil resize-none p-6 leading-relaxed shadow-sm border"
        placeholder="Your transcribed text will appear here..."
      />

      <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between mt-4">
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
          <Button variant="outline" size="sm" onClick={handleConvertAndCopy} disabled={!transcript} className="whitespace-nowrap">
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTxt} disabled={!transcript} className="whitespace-nowrap">
            <FileText className="w-4 h-4 mr-2" /> TXT
          </Button>
          <Button variant="outline" size="sm" onClick={downloadDocx} disabled={!transcript} className="whitespace-nowrap">
            <FileIcon className="w-4 h-4 mr-2 text-blue-600" /> DOCX
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={!transcript} className="whitespace-nowrap">
            <Download className="w-4 h-4 mr-2 text-red-600" /> PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
