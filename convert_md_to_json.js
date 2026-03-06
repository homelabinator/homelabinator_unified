import fs from 'node:fs';
import path from 'node:path';
import fm from 'front-matter';

const appsDir = './content/apps';
const outputDir = './src/data/apps';
const templatesDir = './templates/apps';

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
            
            // Check if Nix template exists
            const hasTemplate = fs.existsSync(path.join(templatesDir, `${id}.nix.hbs`));
            
            const appData = {
                ...parsed.attributes,
                content: parsed.body.trim(),
                id: id,
                hasTemplate: hasTemplate
            };
            
            manifest.push(id);
            const jsonFilePath = path.join(outputDir, `${id}.json`);
            fs.writeFileSync(jsonFilePath, JSON.stringify(appData, null, 2));
            console.log(`Converted ${file} to JSON (hasTemplate: ${hasTemplate})`);
        } catch (err) {
            console.error(`Failed to convert ${file}:`, err);
        }
    }
});

fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Created manifest.json');

// Create services and volumes data
const services = [
    {
        name: 'tailscale',
        title: 'Tailscale',
        description: 'Zero config VPN. Access your homelab from anywhere.',
        fields: [
            { name: 'clientId', label: 'Client ID', type: 'text', placeholder: 'tskey-client-...' },
            { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'tskey-secret-...' }
        ]
    }
];

const volumes = [
    {
        name: 'config',
        title: 'Config Volume',
        description: 'Persistent storage for app configurations.',
        fields: [
            { name: 'path', label: 'Storage Path', type: 'text', placeholder: '/var/lib/homelabinator' }
        ]
    }
];

fs.writeFileSync(path.join(outputDir, '../services.json'), JSON.stringify(services, null, 2));
fs.writeFileSync(path.join(outputDir, '../volumes.json'), JSON.stringify(volumes, null, 2));
console.log('Created services.json and volumes.json');
