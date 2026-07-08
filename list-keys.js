import fs from 'fs';

async function listKeys() {
    try {
        const { availableRegExp } = await import('tamil-language-tools-and-assets');
        console.log(availableRegExp.join(', '));
    } catch (e) {
        console.error(e);
    }
}

listKeys();
