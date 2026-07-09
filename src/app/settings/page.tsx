"use client";

import Image from "next/image";

import { useAppStore } from "@/store";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Save, RefreshCw, Mic, Type, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

type PermissionState = "granted" | "prompt" | "denied" | "unknown";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [autosave, setAutosave] = useState(true);
  const [defaultFont, setDefaultFont] = useState("inter");
  const [micStatus, setMicStatus] = useState<PermissionState>("unknown");
  const [fontStatus, setFontStatus] = useState<PermissionState>("unknown");

  useEffect(() => {
    checkPermissions();
    // Load persisted settings from localStorage
    const saved = localStorage.getItem("esspee-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autosave === "boolean") setAutosave(parsed.autosave);
        if (parsed.defaultFont) setDefaultFont(parsed.defaultFont);
      } catch {}
    }
  }, []);

  const checkPermissions = async () => {
    try {
      const micPerm = await navigator.permissions.query({ name: "microphone" as any });
      setMicStatus(micPerm.state as PermissionState);
      micPerm.onchange = () => setMicStatus(micPerm.state as PermissionState);
    } catch (e) { }

    try {
      const fontPerm = await navigator.permissions.query({ name: "local-fonts" as any });
      setFontStatus(fontPerm.state as PermissionState);
      fontPerm.onchange = () => setFontStatus(fontPerm.state as PermissionState);
    } catch (e) { }
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success("Microphone access granted!");
      checkPermissions();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error("Microphone access denied.");
        setMicStatus("denied");
      } else {
        toast.error("Error requesting microphone.");
      }
    }
  };

  const requestFonts = async () => {
    if ('queryLocalFonts' in window) {
      try {
        // @ts-ignore
        await window.queryLocalFonts();
        toast.success("Local fonts access granted!");
        checkPermissions();
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          toast.error("Fonts access denied.");
          setFontStatus("denied");
        } else {
          toast.error("Error requesting fonts.");
        }
      }
    } else {
      toast.error("Your browser does not support querying local fonts.");
    }
  };

  const StatusIcon = ({ status }: { status: PermissionState }) => {
    switch (status) {
      case "granted": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "denied": return <AlertCircle className="w-5 h-5 text-destructive" />;
      default: return <ShieldAlert className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const StatusBadge = ({ status }: { status: PermissionState }) => {
    switch (status) {
      case "granted": return <span className="text-xs font-medium bg-success/10 text-success px-2 py-1 rounded-full">Allowed</span>;
      case "denied": return <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-full">Blocked</span>;
      default: return <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">Prompt</span>;
    }
  };
  
  const handleSave = () => {
    setIsSaving(true);
    // Persist settings to localStorage so they survive page refreshes
    localStorage.setItem("esspee-settings", JSON.stringify({ autosave, defaultFont }));
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully");
    }, 400);
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your application preferences and default configurations.
        </p>
      </div>

      <div className="bg-background p-6 border rounded-md shadow-sm space-y-8">
        
        {/* Appearance Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Customize the look of the application.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font">Default UI Font</Label>
              <Select value={defaultFont} onValueChange={(v) => v && setDefaultFont(v)}>
                <SelectTrigger id="font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter (Default)</SelectItem>
                  <SelectItem value="noto">Noto Sans Tamil</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose the primary font family for menus.</p>
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Editor Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Live Auto Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save your document locally while typing.
                </p>
              </div>
              <Switch checked={autosave} onCheckedChange={setAutosave} />
            </div>
          </div>
        </div>

        {/* Permissions Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">System Permissions</h3>
          
          {/* Microphone Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Microphone Access</h3>
                  <StatusBadge status={micStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Required for the Voice Typing feature to transcribe your speech into Tamil.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto">
              <StatusIcon status={micStatus} />
              {micStatus === "denied" ? (
                <p className="text-xs text-muted-foreground max-w-[150px] text-right">
                  Click the lock icon in your browser address bar to allow.
                </p>
              ) : (
                <Button 
                  variant={micStatus === "granted" ? "secondary" : "default"} 
                  disabled={micStatus === "granted"}
                  onClick={requestMicrophone}
                >
                  {micStatus === "granted" ? "Granted" : "Request Access"}
                </Button>
              )}
            </div>
          </div>

          {/* Local Fonts Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Type className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Local Fonts Access</h3>
                  <StatusBadge status={fontStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Required to load system-installed fonts (like MS Word) in the document editor.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto">
              <StatusIcon status={fontStatus} />
              {fontStatus === "denied" ? (
                <p className="text-xs text-muted-foreground max-w-[150px] text-right">
                  Click the lock icon in your browser address bar to allow.
                </p>
              ) : (
                <Button 
                  variant={fontStatus === "granted" ? "secondary" : "default"} 
                  disabled={fontStatus === "granted"}
                  onClick={requestFonts}
                >
                  {fontStatus === "granted" ? "Granted" : "Request Access"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="flex flex-col items-center justify-center py-8">
        <Image src="/logo.svg" alt="ESSPEE Logo" width={120} height={120} className="object-contain" />
        <p className="text-sm font-bold text-muted-foreground mt-2">Tamil Writer Pro</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Created by: Mukesh Paramasivan</p>
      </div>
    </div>
  );
}
