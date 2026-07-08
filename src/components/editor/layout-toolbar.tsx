"use client";

import { PageSize, Margins, Orientation } from "./rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Maximize, Layout, FileType } from "lucide-react";

interface LayoutToolbarProps {
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
  margins: Margins;
  setMargins: (margin: Margins) => void;
  orientation: Orientation;
  setOrientation: (orientation: Orientation) => void;
}

export function LayoutToolbar({
  pageSize,
  setPageSize,
  margins,
  setMargins,
  orientation,
  setOrientation
}: LayoutToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-2 rounded-md border text-sm shadow-sm mb-4">
      
      {/* Paper Size */}
      <div className="flex items-center gap-2">
        <FileType className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium hidden sm:inline-block">Size:</span>
        <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
          <SelectTrigger className="w-[110px] h-8 bg-background">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Letter</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Custom">Web (100%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Margins */}
      <div className="flex items-center gap-2">
        <Maximize className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium hidden sm:inline-block">Margins:</span>
        <Select value={margins} onValueChange={(v) => setMargins(v as Margins)}>
          <SelectTrigger className="w-[110px] h-8 bg-background">
            <SelectValue placeholder="Margins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="narrow">Narrow</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orientation */}
      <div className="flex items-center gap-2">
        <Layout className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium hidden sm:inline-block">Orientation:</span>
        <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
          <SelectTrigger className="w-[110px] h-8 bg-background">
            <SelectValue placeholder="Orientation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}
