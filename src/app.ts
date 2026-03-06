import Dexie, { type Table } from 'dexie';
import Handlebars from 'handlebars';
import './style.css';

// --- Database Models ---

export interface AppEntry {
    id?: number;
    name: string; // This is the ID/slug (e.g., 'actual')
    title: string;
    handlebars_config: string;
    installed: number; // 0 or 1
    category?: string;
    replaces?: string;
    tagline?: string;
    docs_link?: string;
    screenshots?: string[];
    icon_link?: string;
    website?: string;
    docker_downloads?: number;
    github_stars?: number;
    content: string;
    services: ServiceEntry[];
    volumes: VolumeEntry[];
    fields: { [key: string]: any };
}

export interface ServiceEntry {
    id?: number;
    name: string;
    core_config: string;
    template_config: string;
    fields: { [key: string]: any };
}

export interface VolumeEntry {
    id?: number;
    name: string;
    core_config: string;
    template_config: string;
    fields: { [key: string]: any };
}

export class HomelabDatabase extends Dexie {
    apps!: Table<AppEntry>;
    services!: Table<ServiceEntry>;
    volumes!: Table<VolumeEntry>;

    constructor() {
        super('HomelabDatabase_Unified');
        this.version(1).stores({
            apps: '&name, category, installed',
            services: '++id, &name',
            volumes: '++id, &name'
        });
    }
}

export const db = new HomelabDatabase();

// --- App Store Logic ---

export class AppStore {
    private static instance: AppStore;
    private isInitializing = false;

    private constructor() {}

    public static getInstance(): AppStore {
        if (!AppStore.instance) {
            AppStore.instance = new AppStore();
        }
        return AppStore.instance;
    }

    async init() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            // For development: clear database to ensure fresh data
            await db.delete();
            await db.open();
            
            const appCount = await db.apps.count();
            if (appCount === 0) {
                console.log('Populating database...');
                
                // 1. Fetch Manifests
                // Note: We need the manifest from both backend templates and frontend content
                // We'll use the JSON manifest we created earlier for the apps metadata
                const response = await fetch('/src/data/apps/manifest.json');
                const appIds = await response.json();

                for (const appId of appIds) {
                    // Fetch metadata (frontend content)
                    const metaResponse = await fetch(`/src/data/apps/${appId}.json`);
                    const metaData = await metaResponse.json();

                    // Fetch Nix template (backend config)
                    let nixConfig = '';
                    try {
                        const nixResponse = await fetch(`/templates/apps/${appId}.nix.hbs`);
                        if (nixResponse.ok) {
                            nixConfig = await nixResponse.text();
                        }
                    } catch (e) {
                        console.warn(`No Nix template for ${appId}`);
                    }

                    await db.apps.put({
                        ...metaData,
                        name: appId,
                        handlebars_config: nixConfig,
                        installed: 0,
                        services: [],
                        volumes: [],
                        fields: {}
                    });
                }

                // 2. Populate Services
                // For simplicity, let's hardcode the ones we saw in the structure
                // In a real scenario, we'd fetch a manifest for these too
                try {
                    const tailscaleCore = await (await fetch('/templates/services/tailscale/core.nix.hbs')).text();
                    const tailscaleTemplate = await (await fetch('/templates/services/tailscale/template.nix.hbs')).text();
                    await db.services.add({
                        name: 'tailscale',
                        core_config: tailscaleCore,
                        template_config: tailscaleTemplate,
                        fields: {}
                    });
                } catch(e) {}

                // 3. Populate Volumes
                try {
                    const configCore = await (await fetch('/templates/volumes/config/core.nix.hbs')).text();
                    const configTemplate = await (await fetch('/templates/volumes/config/template.nix.hbs')).text();
                    await db.volumes.add({
                        name: 'config',
                        core_config: configCore,
                        template_config: configTemplate,
                        fields: { path: '/var/lib/homelabinator' }
                    });
                } catch(e) {}
            }
        } finally {
            this.isInitializing = false;
        }
    }

    async setAppInstalled(name: string, installed: boolean) {
        const app = await db.apps.get({ name });
        if (app) {
            await db.apps.update(app.id!, { installed: installed ? 1 : 0 });
        }
    }

    async generateConfig(): Promise<string> {
        const installedApps = await db.apps.where('installed').equals(1).toArray();
        const coreTemplateResponse = await fetch('/templates/core/config.nix.hbs');
        const coreTemplate = await coreTemplateResponse.text();

        let appsConfig = '';
        let globalServicesConfig = '';

        for (const app of installedApps) {
            let servicesConfig = '';
            // Default services for all apps if none specified? 
            // The original logic seemed to allow adding them manually.
            // Let's add 'tailscale' and 'config' volume if they exist in the app's arrays
            
            for (const service of app.services) {
                const template = Handlebars.compile(service.template_config);
                servicesConfig += template({ app: { name: app.name, port: 8080 }, fields: service.fields });
            }

            let volumesConfig = '';
            for (const volume of app.volumes) {
                const template = Handlebars.compile(volume.template_config);
                volumesConfig += template({ app: { name: app.name }, fields: volume.fields });
            }

            if (app.handlebars_config) {
                const appTemplate = Handlebars.compile(app.handlebars_config);
                appsConfig += appTemplate({ app, services: servicesConfig, volumes: volumesConfig });
            }
        }

        const allServices = await db.services.toArray();
        for (const service of allServices) {
            if (service.core_config && service.core_config.trim() !== '') {
                const template = Handlebars.compile(service.core_config);
                globalServicesConfig += template({ fields: service.fields });
            }
        }

        const finalTemplate = Handlebars.compile(coreTemplate);
        return finalTemplate({ apps: appsConfig, globalservices: globalServicesConfig });
    }
}

const appStore = AppStore.getInstance();

// --- UI Logic ---

async function renderApps(filter = '') {
    const appGrid = document.getElementById('app-grid');
    if (!appGrid) return;

    let apps = await db.apps.toArray();
    
    if (filter) {
        const query = filter.toLowerCase();
        apps = apps.filter(app => 
            app.title.toLowerCase().includes(query) || 
            (app.tagline && app.tagline.toLowerCase().includes(query)) ||
            (app.replaces && app.replaces.toLowerCase().includes(query))
        );
    }

    // Group by category to match original style
    const categories: { [key: string]: AppEntry[] } = {};
    apps.forEach(app => {
        const cat = app.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(app);
    });

    if (apps.length === 0) {
        appGrid.innerHTML = `<div class="col-span-full text-center py-20 opacity-50 text-2xl">No apps found matching "${filter}"</div>`;
        return;
    }

    appGrid.innerHTML = Object.entries(categories).map(([category, catApps]) => `
        <div class="col-span-full mb-12">
            <div class="inline-block bg-primary text-primary-content px-8 py-2 rounded-t-[30px] mb-[-1px]">
                <h2 class="text-2xl font-mono uppercase font-bold">${category}</h2>
            </div>
            <div class="bg-primary p-4 rounded-r-[50px] rounded-bl-[50px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                ${catApps.map(app => `
                    <div class="app-card bg-[#f4f4f4a6] rounded-[30px] p-6 text-center flex flex-col h-full relative">
                        <div class="absolute top-4 right-4 cursor-pointer" onclick="window.showDetails('${app.name}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 opacity-50 hover:opacity-100 transition-opacity">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                        </div>
                        <div class="w-[110px] h-[110px] bg-black rounded-[23px] mx-auto mb-4 flex items-center justify-center overflow-hidden p-[5%]">
                            <img src="${app.icon_link || 'https://picsum.photos/200/300'}" alt="${app.title}" class="w-full h-full object-contain" />
                        </div>
                        <h3 class="text-3xl font-normal mb-1">${app.title}</h3>
                        <p class="text-xl mb-1">${app.tagline || ''}</p>
                        <p class="text-lg italic mb-4 h-12 overflow-hidden">${app.replaces ? `Replaces: ${app.replaces}` : ''}</p>
                        
                        <button 
                            onclick="window.toggleApp('${app.name}')"
                            class="mt-auto w-full py-3 rounded-[20px] text-2xl font-sans border-[5px] transition-all duration-200 ${app.installed ? 'bg-black border-black text-white opacity-30' : 'bg-[#efeef6] border-[#0088ff] text-[#0088ff]'}"
                        >
                            ${app.installed ? 'Added' : 'Add'}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    updateNextButton();
}

async function updateNextButton() {
    const installedCount = await db.apps.where('installed').equals(1).count();
    const nextBtn = document.getElementById('next-button-container');
    if (nextBtn) {
        if (installedCount > 0) {
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.add('hidden');
        }
    }
}

(window as any).toggleApp = async (name: string) => {
    const app = await db.apps.get({ name });
    if (app) {
        await appStore.setAppInstalled(name, !app.installed);
        await renderApps((document.getElementById('app-search') as HTMLInputElement)?.value);
    }
};

(window as any).showDetails = async (name: string) => {
    const app = await db.apps.get({ name });
    if (!app) return;
    
    const modal = document.getElementById('app-modal') as HTMLDialogElement;
    const modalContent = document.getElementById('modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <div class="bg-white border-[5px] border-black rounded-[23px] p-10 flex flex-col lg:flex-row gap-10 max-w-6xl w-full relative">
            <form method="dialog">
                <button class="absolute top-5 right-5 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center text-2xl hover:bg-gray-100">✕</button>
            </form>
            
            <div class="flex-1">
                <div class="flex items-center gap-8 mb-10">
                    <div class="w-[120px] h-[120px] bg-black rounded-[23px] flex items-center justify-center overflow-hidden p-4">
                        <img src="${app.icon_link || 'https://picsum.photos/200/300'}" alt="${app.title}" class="w-full h-full object-contain" />
                    </div>
                    <h1 class="text-7xl lg:text-8xl font-bold">${app.title}</h1>
                </div>
                
                <p class="text-3xl lg:text-4xl leading-snug mb-6">${app.tagline || ''}</p>
                <div class="prose prose-xl max-w-none mb-10 text-gray-700">
                    ${app.content}
                </div>
                
                <div class="bg-[#d9d9d9] p-6 rounded-[23px]">
                    <div class="flex flex-wrap gap-4 mt-4">
                        <a href="${app.website || '#'}" target="_blank" class="flex items-center gap-2 bg-[#efeef6] border-2 border-[#0088ff] text-[#0088ff] px-6 py-2 rounded-xl text-xl font-medium">
                            Website
                        </a>
                        <a href="${app.docs_link || '#'}" target="_blank" class="flex items-center gap-2 bg-[#efeef6] border-2 border-[#0088ff] text-[#0088ff] px-6 py-2 rounded-xl text-xl font-medium">
                            Docs
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="lg:w-[400px] flex flex-col gap-6">
                <div class="aspect-video w-full rounded-[23px] overflow-hidden bg-gray-200">
                    <img src="${app.screenshots?.[0] || 'https://picsum.photos/800/600'}" class="w-full h-full object-cover" />
                </div>
                <button 
                    onclick="window.toggleApp('${app.name}'); (document.getElementById('app-modal') as any).close()"
                    class="w-full py-4 rounded-[20px] text-3xl font-bold border-[5px] transition-all duration-200 ${app.installed ? 'bg-black border-black text-white opacity-30' : 'bg-[#efeef6] border-[#0088ff] text-[#0088ff]'}"
                >
                    ${app.installed ? 'Added' : 'Add App'}
                </button>
            </div>
        </div>
    `;
    modal.showModal();
};

(window as any).goToInstall = async () => {
    // Hide main view, show install view (simulated)
    const config = await appStore.generateConfig();
    console.log("Generated Nix Config:\n", config);
    alert("Configuration generated! Check console for output. (In a real app, this would redirect to the install page)");
};

async function start() {
    await appStore.init();
    await renderApps();

    const searchInput = document.getElementById('app-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderApps((e.target as HTMLInputElement).value);
        });
    }
}

window.addEventListener('DOMContentLoaded', start);
