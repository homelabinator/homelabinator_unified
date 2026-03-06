import fs from 'node:fs';
import path from 'node:path';
import fm from 'front-matter';

const appsDir = './content/apps';
const outputDir = './src/data/apps';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(appsDir);
const manifest = [];

files.forEach(file => {
    if (file.endsWith('.md')) {
        const filePath = path.join(appsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        try {
            const parsed = fm(content);
            const id = path.basename(file, '.md');
            const appData = {
                ...parsed.attributes,
                content: parsed.body.trim(),
                id: id
            };
            
            manifest.push(id);
            const jsonFilePath = path.join(outputDir, `${id}.json`);
            fs.writeFileSync(jsonFilePath, JSON.stringify(appData, null, 2));
            console.log(`Converted ${file} to JSON`);
        } catch (err) {
            console.error(`Failed to convert ${file}:`, err);
        }
    }
});

fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Created manifest.json');
