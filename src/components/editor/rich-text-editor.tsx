"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import CharacterCount from '@tiptap/extension-character-count'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { FontSize, AdvancedLineHeight, LetterSpacing } from './extensions'
import { Toolbar } from './toolbar'
import { useRef, useEffect } from 'react'

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'Custom';
export type Margins = 'normal' | 'narrow' | 'wide' | 'custom';
export type Orientation = 'portrait' | 'landscape';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  pageSize?: PageSize;
  margins?: Margins;
  orientation?: Orientation;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  pageSize = 'A4', 
  margins = 'normal', 
  orientation = 'portrait' 
}: RichTextEditorProps) {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      AdvancedLineHeight,
      LetterSpacing,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Debounce the onChange to prevent parent re-renders on every keystroke
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(editor.getHTML());
      }, 500); // 500ms debounce
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] bg-background dark:prose-invert font-tamil min-w-full h-full',
      },
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Calculate Paper Dimensions
  const getPaperDimensions = () => {
    // Standard sizes in pixels (assuming 96 DPI for rough screen equivalent)
    const dimensions = {
      A4: { w: 794, h: 1123 }, // 210x297mm
      Letter: { w: 816, h: 1056 }, // 8.5x11 inches
      Legal: { w: 816, h: 1344 }, // 8.5x14 inches
      Custom: { w: '100%', h: 'auto' }
    };
    
    let baseDim = dimensions[pageSize] || dimensions.A4;
    if (pageSize === 'Custom') return { width: '100%', minHeight: '800px' };

    const isLandscape = orientation === 'landscape';
    return {
      width: isLandscape ? `${baseDim.h}px` : `${baseDim.w}px`,
      minHeight: isLandscape ? `${baseDim.w}px` : `${baseDim.h}px`,
    };
  };

  const getMarginClass = () => {
    switch (margins) {
      case 'narrow': return 'p-4 sm:p-8';
      case 'wide': return 'p-12 sm:p-24';
      case 'normal':
      default:
        return 'p-8 sm:p-16';
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {editor && <Toolbar editor={editor} />}
      
      {/* Page Canvas Background */}
      <div className="flex-1 overflow-y-auto bg-muted/30 py-8 px-4 flex justify-center">
        {/* The Paper */}
        <div 
          className={`bg-background border shadow-md flex-shrink-0 transition-all duration-300 ${getMarginClass()}`}
          style={{ ...getPaperDimensions() }}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
      <div className="flex justify-end text-xs text-muted-foreground mt-2">
        {editor?.storage.characterCount.words()} words | {editor?.storage.characterCount.characters()} characters
      </div>
    </div>
  );
}
