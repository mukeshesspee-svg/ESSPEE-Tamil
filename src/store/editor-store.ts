import { create } from 'zustand';

interface EditorStore {
  // Voice Dictation
  voiceTranscript: string;
  setVoiceTranscript: (transcript: string) => void;
  voiceLanguage: string;
  setVoiceLanguage: (language: string) => void;
  voiceTargetFont: string;
  setVoiceTargetFont: (targetFont: string) => void;

  // Tanglish Editor
  tanglishText: string;
  setTanglishText: (text: string) => void;
  tanglishTargetFont: string;
  setTanglishTargetFont: (targetFont: string) => void;

  // AI Writer
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiResult: string;
  setAiResult: (result: string) => void;
  aiTone: string;
  setAiTone: (tone: string) => void;
  aiTargetFont: string;
  setAiTargetFont: (targetFont: string) => void;

  // OCR Scanner
  ocrImage: string | null;
  setOcrImage: (image: string | null) => void;
  ocrFileType: string | null;
  setOcrFileType: (fileType: string | null) => void;
  ocrResult: string;
  setOcrResult: (result: string) => void;
  ocrLang: string;
  setOcrLang: (lang: string) => void;
  ocrExtractTamilOnly: boolean;
  setOcrExtractTamilOnly: (extractTamilOnly: boolean) => void;
  ocrUseAi: boolean;
  setOcrUseAi: (useAi: boolean) => void;
  ocrAutoCorrect: boolean;
  setOcrAutoCorrect: (autoCorrect: boolean) => void;
  ocrTargetFont: string;
  setOcrTargetFont: (targetFont: string) => void;

  // Rich Text Editor
  richTextContent: string;
  setRichTextContent: (content: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Voice Dictation
  voiceTranscript: '',
  setVoiceTranscript: (voiceTranscript) => set({ voiceTranscript }),
  voiceLanguage: 'ta-IN',
  setVoiceLanguage: (voiceLanguage) => set({ voiceLanguage }),
  voiceTargetFont: 'bamini',
  setVoiceTargetFont: (voiceTargetFont) => set({ voiceTargetFont }),

  // Tanglish Editor
  tanglishText: '',
  setTanglishText: (tanglishText) => set({ tanglishText }),
  tanglishTargetFont: 'bamini',
  setTanglishTargetFont: (tanglishTargetFont) => set({ tanglishTargetFont }),

  // AI Writer
  aiPrompt: '',
  setAiPrompt: (aiPrompt) => set({ aiPrompt }),
  aiResult: '',
  setAiResult: (aiResult) => set({ aiResult }),
  aiTone: 'professional',
  setAiTone: (aiTone) => set({ aiTone }),
  aiTargetFont: 'bamini',
  setAiTargetFont: (aiTargetFont) => set({ aiTargetFont }),

  // OCR Scanner
  ocrImage: null,
  setOcrImage: (ocrImage) => set({ ocrImage }),
  ocrFileType: null,
  setOcrFileType: (ocrFileType) => set({ ocrFileType }),
  ocrResult: '',
  setOcrResult: (ocrResult) => set({ ocrResult }),
  ocrLang: 'tam',
  setOcrLang: (ocrLang) => set({ ocrLang }),
  ocrExtractTamilOnly: false,
  setOcrExtractTamilOnly: (ocrExtractTamilOnly) => set({ ocrExtractTamilOnly }),
  ocrUseAi: true,
  setOcrUseAi: (ocrUseAi) => set({ ocrUseAi }),
  ocrAutoCorrect: true,
  setOcrAutoCorrect: (ocrAutoCorrect) => set({ ocrAutoCorrect }),
  ocrTargetFont: 'bamini',
  setOcrTargetFont: (ocrTargetFont) => set({ ocrTargetFont }),

  // Rich Text Editor
  richTextContent: '',
  setRichTextContent: (richTextContent) => set({ richTextContent }),
}));
