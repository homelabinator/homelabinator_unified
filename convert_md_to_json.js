import fs from 'node:fs';
import path from 'node:path';
import fm from 'front-matter';

const appsDir = './content/apps';
const servicesDir = './content/services';
const volumesDir = './content/volumes';
const outputDir = './src/data/apps';
const templatesDir = './templates/apps';
const serviceTemplatesDir = './templates/services';
const volumeTemplatesDir = './templates/volumes';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function convertDirToJSON(sourceDir, outputDir, manifestName, templatesBaseDir) {
    if (!fs.existsSync(sourceDir)) {
        console.warn(`Source directory ${sourceDir} does not exist.`);
        return [];
    }
    
    const files = fs.readdirSync(sourceDir);
    const manifest = [];

    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(sourceDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            try {
                const parsed = fm(content);
                const id = path.basename(file, '.md');
                
                // Check if Nix template exists
                let hasTemplate = false;
                if (templatesBaseDir) {
                    hasTemplate = fs.existsSync(path.join(templatesBaseDir, id, 'template.nix.hbs')) || 
                                 fs.existsSync(path.join(templatesBaseDir, `${id}.nix.hbs`));
                }
                
                const data = {
                    ...parsed.attributes,
                    content: parsed.body.trim(),
                    id: id,
                    hasTemplate: hasTemplate,
                    name: id
                };
                
                manifest.push(id);
                const jsonFilePath = path.join(outputDir, manifestName === 'apps' ? `${id}.json` : `../${manifestName}/${id}.json`);
                
                const finalOutputDir = path.dirname(jsonFilePath);
                if (!fs.existsSync(finalOutputDir)) {
                    fs.mkdirSync(finalOutputDir, { recursive: true });
                }
                
                fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
                console.log(`Converted ${file} to JSON (id: ${id}, type: ${manifestName})`);
            } catch (err) {
                console.error(`Failed to convert ${file}:`, err);
            }
        }
    });

    if (manifestName === 'apps') {
        fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log('Created manifest.json for apps');
    } else {
        // For services and volumes, we still want to keep the old arrays for now to avoid breaking too much
        const allData = manifest.map(id => {
            const jsonFilePath = path.join(outputDir, `../${manifestName}/${id}.json`);
            return JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        });
        fs.writeFileSync(path.join(outputDir, `../${manifestName}.json`), JSON.stringify(allData, null, 2));
        console.log(`Created ${manifestName}.json`);
    }
    
    return manifest;
}

convertDirToJSON(appsDir, outputDir, 'apps', templatesDir);
convertDirToJSON(servicesDir, outputDir, 'services', serviceTemplatesDir);
convertDirToJSON(volumesDir, outputDir, 'volumes', volumeTemplatesDir);
