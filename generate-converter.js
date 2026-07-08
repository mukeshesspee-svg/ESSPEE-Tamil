import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
    try {
        const { regExpList } = await import('tamil-language-tools-and-assets');
        
        const fontsToExtract = ['Bamini', 'Tab', 'Tscii', 'Anjal', 'Senthamizh', 'Tam'];
        const allMappings = {};
        
        for (const font of fontsToExtract) {
            const fontArray = regExpList[font];
            if (!fontArray) continue;

            let mappings = [];
            
            for (const [regex, unicodeString] of fontArray) {
                const regexStr = regex.toString();
                let latinStr = regexStr.substring(1, regexStr.lastIndexOf('/'));
                latinStr = latinStr.replace(/\\(.)/g, '$1');
                
                mappings.push({
                    unicode: unicodeString,
                    latin: latinStr
                });
            }
            
            mappings.sort((a, b) => b.unicode.length - a.unicode.length);
            allMappings[font.toLowerCase()] = mappings;
        }

        // Add Suntommy from JSON
        const sunTommyJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'lib', 'tamilFontsUnicode.json'), 'utf8'));
        const sunTommyObj = sunTommyJson.suntommy['font-keymap'];
        let sunTommyArray = [];
        for (const [unicode, latin] of Object.entries(sunTommyObj)) {
            sunTommyArray.push({ unicode, latin });
        }
        sunTommyArray.sort((a, b) => b.unicode.length - a.unicode.length);
        allMappings['suntommy'] = sunTommyArray;
        
        const tsContent = `// Auto-generated Unicode to Legacy Font mappings

export const fontMappings: Record<string, Array<{unicode: string, latin: string}>> = ${JSON.stringify(allMappings, null, 2)};

export function convertUnicodeToLegacy(text: string, fontKey: string): string {
    let result = text;
    const mapping = fontMappings[fontKey];
    
    if (!mapping) return text;
    
    for (const item of mapping) {
        // Use split/join to replace all occurrences securely
        result = result.split(item.unicode).join(item.latin);
    }
    
    return result;
}
`;

        fs.writeFileSync(path.join(__dirname, 'src', 'lib', 'tamil-converter.ts'), tsContent);
        console.log('Successfully generated src/lib/tamil-converter.ts with multiple fonts');
    } catch (e) {
        console.error(e);
    }
}

generate();
