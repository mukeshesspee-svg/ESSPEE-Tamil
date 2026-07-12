import { fontMappings } from './tamil-converter';
import { regExpHelper } from 'tamil-language-tools-and-assets';

export type FontEncoding = 'unicode' | string;

export class TamilFontConverter {
  public convert(text: string, from: FontEncoding, to: FontEncoding): string {
    if (from === to) return text;

    if (from === 'unicode' && to !== 'unicode') {
      const helperName = `UnicodeTo${to.charAt(0).toUpperCase() + to.slice(1)}`;
      if (regExpHelper && (regExpHelper as Record<string, (text: string) => string>)[helperName]) {
        return (regExpHelper as Record<string, (text: string) => string>)[helperName](text);
      }

      const mapping = fontMappings[to];
      if (!mapping) throw new Error(`Mapping to ${to} is not supported.`);
      let result = text;
      for (const item of mapping) {
        result = result.split(item.unicode).join(item.latin);
      }
      return result;
    }

    if (from !== 'unicode' && to === 'unicode') {
      const helperName = `${from.charAt(0).toUpperCase() + from.slice(1)}ToUnicode`;
      if (regExpHelper && (regExpHelper as Record<string, (text: string) => string>)[helperName]) {
        return (regExpHelper as Record<string, (text: string) => string>)[helperName](text);
      }

      const mapping = fontMappings[from];
      if (!mapping) throw new Error(`Mapping from ${from} is not supported.`);
      
      // Reverse mapping: we must sort by latin length descending to avoid partial replacements
      const reverseMapping = [...mapping].sort((a, b) => b.latin.length - a.latin.length);
      
      let result = text;
      for (const item of reverseMapping) {
        if (item.latin) {
            result = result.split(item.latin).join(item.unicode);
        }
      }
      return result;
    }

    // Legacy to Legacy: convert through Unicode
    if (from !== 'unicode' && to !== 'unicode') {
      const intermediate = this.convert(text, from, 'unicode');
      return this.convert(intermediate, 'unicode', to);
    }
    
    return text;
  }
}

export const fontConverter = new TamilFontConverter();
