import fs from 'node:fs';
import path from 'node:path';

const dir = 'templates/apps';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.nix.hbs')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove all existing hooks (with optional whitespace)
        content = content.replace(/\{\{\{services\}\}\}/g, '');
        content = content.replace(/\{\{\{volumes\}\}\}/g, '');
        
        // Find the last ];
        const lastBracketIndex = content.lastIndexOf('];');
        if (lastBracketIndex !== -1) {
            const before = content.substring(0, lastBracketIndex).trimEnd();
            const after = content.substring(lastBracketIndex);
            
            const newContent = `${before}\n  {{{services}}}\n  {{{volumes}}}\n${after}`;
            fs.writeFileSync(filePath, newContent);
            console.log(`Fixed ${file}`);
        } else {
            console.log(`Could not find ]; in ${file}`);
        }
    }
});
