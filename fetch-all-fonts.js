import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newFonts = [
    'vanavil', 'shree_lipi', 'ka', 'jeeva', 'chenet', 'lttm', 
    'mcl', 'dinak', 'tac', 'diamond', 'dci_tml_ismail', 'kruti', 
    'ananku_helv', 'inscript', 'mylai', 'vikatan', 'indoweb', 
    'murasoli', 'indoword', 'thinathanthi', 'dinamani', 'thinaboomi', 
    'thatstamil', 'amudham', 'annu'
];

function fetchJS(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                resolve(null);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

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
                mappings.push({ unicode: unicodeString, latin: latinStr });
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

        // Fetch remaining new fonts
        for (const font of newFonts) {
            console.log(`Fetching ${font}...`);
            const code = await fetchJS(`https://tamilfontconverter.co.in/assets/js_uni_to_nuni/${font}.js`);
            if (!code) {
                console.log(`Failed to fetch ${font}.js`);
                continue;
            }

            let mappings = [];
            const regex = /\.replace\(\/(.+?)\/g,\s*"([^"]*)"\)/g;
            let match;
            while ((match = regex.exec(code)) !== null) {
                let latin = match[2];
                latin = latin.replace(/\\"/g, '"');
                latin = latin.replace(/\\'/g, "'");
                mappings.push({
                    unicode: match[1],
                    latin: latin
                });
            }
            
            if (mappings.length > 0) {
                mappings.sort((a, b) => b.unicode.length - a.unicode.length);
                allMappings[font] = mappings;
                console.log(`Successfully parsed ${mappings.length} mappings for ${font}`);
            } else {
                console.log(`No mappings found for ${font}`);
            }
        }
        
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
        console.log('Successfully updated src/lib/tamil-converter.ts with ALL fonts');
        console.log("AVAILABLE:", Object.keys(allMappings).join(', '));
    } catch (e) {
        console.error(e);
    }
}

generate();
