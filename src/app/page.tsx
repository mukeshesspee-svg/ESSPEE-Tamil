"use client";

import { Card } from "@/components/ui/card";
import { Mic, ScanLine, Keyboard, ArrowRight, Languages, FileOutput } from "lucide-react";
import Link from "next/link";

const tools = [
  {
    title: "Tanglish Typing",
    description: "Type in Tanglish (Thanglish) and instantly get perfect Tamil Unicode text.",
    icon: <Keyboard className="w-8 h-8" />,
    href: "/tanglish",
    color: "bg-[#3B82F6]",
    shadowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    title: "OCR Scanner",
    description: "Extract Tamil and English text from images or PDFs with AI precision.",
    icon: <ScanLine className="w-8 h-8" />,
    href: "/ocr",
    color: "bg-[#A855F7]",
    shadowColor: "rgba(168, 85, 247, 0.2)"
  },
  {
    title: "Voice Typing",
    description: "Speak in Tamil and watch it translate to text in real-time.",
    icon: <Mic className="w-8 h-8" />,
    href: "/voice",
    color: "bg-[#F97316]",
    shadowColor: "rgba(249, 115, 22, 0.2)"
  },
  {
    title: "Font Converter",
    description: "Convert Unicode to legacy encodings like Bamini, Vanavil, and TAB.",
    icon: <Languages className="w-8 h-8" />,
    href: "/converter",
    color: "bg-[#10B981]",
    shadowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    title: "Batch Processing",
    description: "Convert massive text files or multiple documents in one click.",
    icon: <FileOutput className="w-8 h-8" />,
    href: "/batch",
    color: "bg-[#6366F1]",
    shadowColor: "rgba(99, 102, 241, 0.2)"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-card border p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#3B7BFF0D] blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-[#3B82F60D] blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Welcome to<br />
            <span className="text-primary block mt-2">ESSPEE Tamil Writer Pro</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            The ultimate suite for Tamil content creation. Type seamlessly, extract text from ancient documents with AI, and convert between legacy fonts in seconds.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Explore Tools</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="block group">
              <Card 
                className="relative h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-[#3B7BFF0D]"
                style={{ '--tw-shadow-color': tool.shadowColor } as React.CSSProperties}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${tool.color} transition-opacity duration-500`}></div>
                
                <div className="p-6 h-full flex flex-col">
                  <div className={`inline-flex p-3 rounded-2xl ${tool.color} text-white mb-4 shadow-lg w-fit`}>
                    {tool.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  
                  <p className="text-muted-foreground flex-1 mb-6">
                    {tool.description}
                  </p>
                  
                  <div className="flex items-center text-sm font-semibold text-primary mt-auto">
                    Launch Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions / Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6 bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Did you know?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our AI OCR mode uses Google Gemini Vision to read faded ancient Tamil manuscripts with near 100% accuracy. It's completely free to use with your own API key!
          </p>
        </div>
        <div className="rounded-2xl border p-6 bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Keyboard Shortcuts</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Use <kbd className="px-2 py-1 bg-muted rounded-md text-xs font-mono">Ctrl + S</kbd> in the Editor to quickly save your documents. Switch tools seamlessly using the sidebar navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
