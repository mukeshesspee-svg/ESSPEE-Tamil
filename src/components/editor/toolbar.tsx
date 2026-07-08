"use client";

import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Superscript,
  Subscript,
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"

interface ToolbarProps {
  editor: Editor
}

export function Toolbar({ editor }: ToolbarProps) {
  const [fontOpen, setFontOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [fonts, setFonts] = useState<string[]>([
    "Inter",
    "Arial",
    "Courier New",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Noto Sans Tamil",
    "Bamini",
    "Latha"
  ]);

  const loadSystemFonts = async () => {
    if ('queryLocalFonts' in window) {
      try {
        // @ts-ignore
        const localFonts = await window.queryLocalFonts();
        // @ts-ignore
        const fontNames = Array.from(new Set(localFonts.map(f => f.family)));
        setFonts(prev => Array.from(new Set([...prev, ...fontNames])).sort());
      } catch (err) {
        console.error("Failed to load system fonts", err);
      }
    }
  };

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 border rounded-md bg-background sticky top-16 z-10 shadow-sm">
      {/* Font Family Combobox */}
      <Popover 
        open={fontOpen} 
        onOpenChange={(open) => {
          setFontOpen(open);
          if (open && fonts.length < 20) {
            loadSystemFonts();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={fontOpen}
            className="w-[140px] h-8 text-xs font-medium justify-between px-2"
          >
            <span className="truncate">
              {editor.getAttributes('textStyle').fontFamily || 'Inter'}
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search font..." 
              className="h-9 text-xs" 
              value={fontSearch}
              onValueChange={setFontSearch}
            />
            <CommandList>
              <CommandEmpty>No font found.</CommandEmpty>
              <CommandGroup>
                {fonts
                  .filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()))
                  .slice(0, 50)
                  .map((font) => (
                  <CommandItem
                    key={font}
                    value={font}
                    onSelect={(currentValue) => {
                      const actualFont = fonts.find(f => f.toLowerCase() === currentValue.toLowerCase()) || font;
                      if (actualFont === 'default') {
                        editor.chain().focus().unsetFontFamily().run();
                      } else {
                        editor.chain().focus().setFontFamily(actualFont).run();
                      }
                      setFontOpen(false);
                      setFontSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (editor.getAttributes('textStyle').fontFamily || 'Inter') === font ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span style={{ fontFamily: font }}>{font}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font Size */}
      <Select
        value={editor.getAttributes('textStyle').fontSize || '16px'}
        onValueChange={(val) => {
          if (val === 'default') editor.chain().focus().unsetFontSize().run();
          else editor.chain().focus().setFontSize(val).run();
        }}
      >
        <SelectTrigger className="w-[80px] h-8 text-xs">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(size => (
            <SelectItem key={size} value={`${size}px`}>{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Line Height */}
      <Select
        value={editor.getAttributes('paragraph').lineHeight || '1.5'}
        onValueChange={(val) => {
          if (val === 'default') editor.chain().focus().unsetLineHeight().run();
          else editor.chain().focus().setLineHeight(val).run();
        }}
      >
        <SelectTrigger className="w-[80px] h-8 text-xs">
          <SelectValue placeholder="Line" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1.0</SelectItem>
          <SelectItem value="1.15">1.15</SelectItem>
          <SelectItem value="1.5">1.5</SelectItem>
          <SelectItem value="2">2.0</SelectItem>
          <SelectItem value="2.5">2.5</SelectItem>
        </SelectContent>
      </Select>

      {/* Letter Spacing */}
      <Select
        value={editor.getAttributes('textStyle').letterSpacing || 'normal'}
        onValueChange={(val) => {
          if (val === 'normal') editor.chain().focus().unsetLetterSpacing().run();
          else editor.chain().focus().setLetterSpacing(val).run();
        }}
      >
        <SelectTrigger className="w-[80px] h-8 text-xs">
          <SelectValue placeholder="Space" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">0px</SelectItem>
          <SelectItem value="1px">1px</SelectItem>
          <SelectItem value="2px">2px</SelectItem>
          <SelectItem value="3px">3px</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <Toggle
        size="sm"
        pressed={editor.isActive('superscript')}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label="Toggle superscript"
      >
        <Superscript className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('subscript')}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Toggle subscript"
      >
        <Subscript className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Toggle heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Toggle heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        aria-label="Align justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <div className="flex-1" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}
