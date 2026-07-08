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
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-blue-500/20"
  },
  {
    title: "OCR Scanner",
    description: "Extract Tamil and English text from images or PDFs with AI precision.",
    icon: <ScanLine className="w-8 h-8" />,
    href: "/ocr",
    gradient: "from-purple-500 to-pink-500",
    shadow: "shadow-purple-500/20"
  },
  {
    title: "Voice Typing",
    description: "Speak in Tamil and watch it translate to text in real-time.",
    icon: <Mic className="w-8 h-8" />,
    href: "/voice",
    gradient: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/20"
  },
  {
    title: "Font Converter",
    description: "Convert Unicode to legacy encodings like Bamini, Vanavil, and TAB.",
    icon: <Languages className="w-8 h-8" />,
    href: "/converter",
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-emerald-500/20"
  },
  {
    title: "Batch Processing",
    description: "Convert massive text files or multiple documents in one click.",
    icon: <FileOutput className="w-8 h-8" />,
    href: "/batch",
    gradient: "from-indigo-500 to-blue-600",
    shadow: "shadow-indigo-500/20"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Welcome to<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 block mt-2">ESSPEE Tamil Writer Pro</span>
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
              <Card className={`relative h-full overflow-hidden transition-all duration-300 hover:shadow-xl ${tool.shadow} hover:-translate-y-1 border-primary/5`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${tool.gradient} transition-opacity duration-500`}></div>
                
                <div className="p-6 h-full flex flex-col">
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white mb-4 shadow-lg w-fit`}>
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
