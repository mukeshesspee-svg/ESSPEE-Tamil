"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { Mic, MicOff, Copy, Trash2, Languages, Download, FileText, File as FileIcon, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
    // Fallback for HTTP or older browsers
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

export function VoiceDictation() {
  const [isListening, setIsListening] = useState(false);
  const {
    voiceTranscript: transcript,
    setVoiceTranscript: setTranscript,
    voiceLanguage: language,
    setVoiceLanguage: setLanguage,
    voiceTargetFont: targetFont,
    setVoiceTargetFont: setTargetFont,
  } = useEditorStore();
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  // This ref always holds the latest committed (final) transcript text
  // and is safe to use inside event handlers without stale closure issues.
  const finalTranscriptRef = useRef(transcript);

  useEffect(() => {
    // Check browser support on mount
    if (
      typeof window === "undefined" ||
      (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window))
    ) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let currentSessionFinal = "";
      let currentSessionInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentSessionFinal += transcriptText;
        } else {
          currentSessionInterim += transcriptText;
        }
      }

      // Combine committed text with this session's output
      let finalToAppend = currentSessionFinal;
      let interimToAppend = currentSessionInterim;
      
      if (targetFont !== "unicode") {
        const converter = new TamilFontConverter();
        if (finalToAppend) finalToAppend = converter.convert(finalToAppend, "unicode", targetFont);
        if (interimToAppend) interimToAppend = converter.convert(interimToAppend, "unicode", targetFont);
      }

      const newText = finalTranscriptRef.current + finalToAppend + interimToAppend;
      setTranscript(newText);

      // When we get finalized text this session, update the ref so onend can use it
      if (finalToAppend) {
        finalTranscriptRef.current = finalTranscriptRef.current + finalToAppend;
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        toast.error(
          "Microphone blocked! If access is granted, check if another app is using the mic, or if your browser (like Brave) blocks Speech APIs."
        );
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        // 'aborted' happens when we manually call .stop() — it's not a real error
        toast.error(`Speech recognition error: ${event.error}`);
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      // Chrome stops the recognition after a short silence. If we're still in
      // "listening" mode, restart it. finalTranscriptRef always holds the correct
      // committed text (no stale closure problem since it's a ref, not state).
      if (isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

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
      try {
        // Sync the ref with whatever the user may have typed manually
        finalTranscriptRef.current = transcript;
        recognitionRef.current.lang = language;
        
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
        toast.success("Listening started...");
      } catch (e: any) {
        if (e.name === "NotAllowedError" || e.message?.includes("not allowed")) {
          toast.error(
            "Microphone blocked. Ensure no other app is using it, and you are using Google Chrome (not Brave)."
          );
        } else {
          toast.error(`Mic error: ${e.name || "Unknown"} - ${e.message || "busy/blocked"}`);
        }
      }
    }
  };

  const getConvertedText = () => {
    // Transcript is already stored in the targetFont format!
    return transcript;
  };

  const handleConvertAndCopy = async () => {
    if (!transcript) {
      toast.error("No text to convert.");
      return;
    }
    try {
      await copyToClipboard(getConvertedText());
      toast.success(
        `Copied as ${targetFont === "unicode" ? "Unicode" : targetFont.toUpperCase()}! Paste it in your document.`
      );
    } catch {
      toast.error("Failed to copy. Please select the text manually and copy.");
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(transcript);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please select the text manually.");
    }
  };

  const downloadTxt = () => {
    const output = getConvertedText();
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "voice-transcript.txt");
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

  // Browser not supported — show a clear message
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full max-w-5xl mx-auto py-16 text-center">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-full">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold">Browser Not Supported</h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Voice Typing requires the Web Speech API, which is only supported in{" "}
          <strong>Google Chrome</strong> and <strong>Microsoft Edge</strong> on desktop and
          Android. It is not available on Firefox or Safari.
        </p>
        <p className="text-sm text-muted-foreground bg-muted rounded-md px-4 py-3 max-w-md">
          💡 Please open this page in Chrome or Edge to use Voice Typing.
        </p>
      </div>
    );
  }

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
            <h3 className="font-medium">
              {isListening ? "Listening..." : "Click microphone to start"}
            </h3>
            <p className="text-xs text-muted-foreground">Speak clearly into your microphone.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={language}
            onValueChange={(v) => {
              if (v) {
                setLanguage(v);
                if (v.startsWith("en")) {
                  setTargetFont("unicode");
                } else {
                  setTargetFont("bamini");
                }
              }
            }}
            disabled={isListening}
          >
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

          <Button variant="outline" size="icon" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setTranscript("");
              finalTranscriptRef.current = "";
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Textarea
        value={transcript}
        onChange={(e) => {
          setTranscript(e.target.value);
          // Keep ref in sync if user edits manually while NOT listening
          if (!isListeningRef.current) {
            finalTranscriptRef.current = e.target.value;
          }
        }}
        className={`flex-1 min-h-[500px] text-lg resize-none p-6 leading-relaxed shadow-sm border placeholder:font-sans ${targetFont === 'bamini' ? 'font-bamini' : 'font-tamil'}`}
        placeholder="Your transcribed text will appear here..."
      />

      <div className="p-4 border rounded-md bg-muted/20 flex flex-col sm:flex-row items-center gap-4 justify-between mt-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Convert Font:
          </span>
          <Select 
            value={targetFont} 
            onValueChange={(v) => {
              if (v && transcript) {
                try {
                  const converter = new TamilFontConverter();
                  const converted = converter.convert(transcript, targetFont, v);
                  setTranscript(converted);
                  finalTranscriptRef.current = converted;
                } catch (e) {
                  console.error("Conversion error", e);
                }
              }
              if (v) setTargetFont(v);
            }}
          >
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
            disabled={!transcript}
            className="whitespace-nowrap"
          >
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTxt}
            disabled={!transcript}
            className="whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-2" /> TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDocx}
            disabled={!transcript}
            className="whitespace-nowrap"
          >
            <FileIcon className="w-4 h-4 mr-2 text-blue-600" /> DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={!transcript}
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2 text-red-600" /> PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
