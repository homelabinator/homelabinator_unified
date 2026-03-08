import Dexie, { type Table } from 'dexie';
import Handlebars from 'handlebars';
import './style.css';

// --- Database Models ---

export interface AppEntry {
    id?: number;
    name: string; // slug
    title: string;
    handlebars_config: string;
    installed: number;
    category?: string;
    replaces?: string;
    tagline?: string;
    docs_link?: string;
    screenshots?: string[];
    icon_link?: string;
    website?: string;
    content: string;
    hasTemplate: boolean;
    services: string[]; // List of service names applied
    volumes: string[];   // List of volume names applied
    fields: { [key: string]: any };
}

export interface ServiceEntry {
    id?: number;
    name: string;
    title: string;
    description: string;
    core_config: string;
    template_config: string;
    fields_def: any[]; // Definition of fields
    fields: { [key: string]: any }; // Current values (for "Apply to All" or default)
}

export interface VolumeEntry {
    id?: number;
    name: string;
    title: string;
    description: string;
    core_config: string;
    template_config: string;
    fields_def: any[];
    fields: { [key: string]: any };
}

export class HomelabDatabase extends Dexie {
    apps!: Table<AppEntry>;
    services!: Table<ServiceEntry>;
    volumes!: Table<VolumeEntry>;

    constructor() {
        super('HomelabDatabase_V3');
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
            // Check if already populated
            const count = await db.apps.count();
            if (count > 0) return;

            // 1. Populate Apps
            const response = await fetch('/src/data/apps/manifest.json');
            const appIds = await response.json();

            for (const appId of appIds) {
                const metaResponse = await fetch(`/src/data/apps/${appId}.json`);
                const metaData = await metaResponse.json();

                let nixConfig = '';
                if (metaData.hasTemplate) {
                    try {
                        const nixResponse = await fetch(`/templates/apps/${appId}.nix.hbs`);
                        if (nixResponse.ok) nixConfig = await nixResponse.text();
                    } catch (e) {}
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
            const servicesResponse = await fetch('/src/data/services.json');
            const servicesData = await servicesResponse.json();
            for (const s of servicesData) {
                let core = '', tmpl = '';
                try {
                    core = await (await fetch(`/templates/services/${s.name}/core.nix.hbs`)).text();
                    tmpl = await (await fetch(`/templates/services/${s.name}/template.nix.hbs`)).text();
                } catch(e) {}
                await db.services.put({ 
                    ...s, 
                    core_config: core, 
                    template_config: tmpl, 
                    fields: {},
                    fields_def: s.fields // Map fields from JSON to fields_def
                });
            }

            // 3. Populate Volumes
            const volumesResponse = await fetch('/src/data/volumes.json');
            const volumesData = await volumesResponse.json();
            for (const v of volumesData) {
                let core = '', tmpl = '';
                try {
                    core = await (await fetch(`/templates/volumes/${v.name}/core.nix.hbs`)).text();
                    tmpl = await (await fetch(`/templates/volumes/${v.name}/template.nix.hbs`)).text();
                } catch(e) {}
                await db.volumes.put({ 
                    ...v, 
                    core_config: core, 
                    template_config: tmpl, 
                    fields: { path: '/var/lib/homelabinator' },
                    fields_def: v.fields // Map fields from JSON to fields_def
                });
            }

        } finally {
            this.isInitializing = false;
        }
    }

    async setAppInstalled(name: string, installed: boolean) {
        await db.apps.update(name, { installed: installed ? 1 : 0 });
    }

    async generateConfig(): Promise<string> {
        const installedApps = await db.apps.where('installed').equals(1).toArray();
        const coreTemplate = await (await fetch('/templates/core/config.nix.hbs')).text();
        const allServices = await db.services.toArray();
        const allVolumes = await db.volumes.toArray();

        let appsConfig = '';
        let globalServicesConfig = '';

        for (const app of installedApps) {
            let servicesConfig = '';
            for (const sName of app.services) {
                const s = allServices.find(x => x.name === sName);
                if (s) {
                    const template = Handlebars.compile(s.template_config);
                    servicesConfig += template({ app: { name: app.name, port: 8080 }, fields: { ...s.fields, ...app.fields[sName] } });
                }
            }

            let volumesConfig = '';
            for (const vName of app.volumes) {
                const v = allVolumes.find(x => x.name === vName);
                if (v) {
                    const template = Handlebars.compile(v.template_config);
                    volumesConfig += template({ app: { name: app.name }, fields: { ...v.fields, ...app.fields[vName] } });
                }
            }

            if (app.handlebars_config) {
                const appTemplate = Handlebars.compile(app.handlebars_config);
                appsConfig += appTemplate({ app, services: servicesConfig, volumes: volumesConfig });
            }
        }

        for (const s of allServices) {
            if (s.core_config && s.core_config.trim() !== '') {
                const template = Handlebars.compile(s.core_config);
                globalServicesConfig += template({ fields: s.fields });
            }
        }

        return Handlebars.compile(coreTemplate)({ apps: appsConfig, globalservices: globalServicesConfig });
    }
}

const appStore = AppStore.getInstance();

// --- Routing & UI State ---

type Page = 'apps' | 'services' | 'install';
let currentPage: Page = 'apps';
let expandedSections: Set<string> = new Set();
let globalExpanded = false;

const categoryColors: { [key: string]: string } = {
    'Utility': '#b0e6c3',
    'Media': '#bfbeff',
    'Communication': '#ee5a62',
    'Network': '#ffe082',
    'Security': '#ffab91',
    'Other': '#e1bee7'
};

function getCategoryColor(cat: string) {
    return categoryColors[cat] || categoryColors['Other'];
}

function setPage(page: Page) {
    currentPage = page;
    render();
    window.scrollTo(0, 0);
}

// --- Page Renderers ---

async function renderAppsPage(filter = '') {
    const appGrid = document.getElementById('main-content');
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

    const categories: { [key: string]: AppEntry[] } = {};
    apps.forEach(app => {
        const cat = app.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(app);
    });

    const anyCanExpand = Object.values(categories).some(list => list.length > 5);

    appGrid.innerHTML = `
        <div class="text-center py-20 px-5">
            <h1 class="text-[96px] font-bold m-0 leading-tight">Homelabinator</h1>
            <p class="text-5xl font-light mt-2.5">Self-Host with Ease</p>
        </div>

        <div class="max-w-[1600px] mx-auto px-8 mb-8 flex justify-end">
            ${anyCanExpand ? `
                <button onclick="window.toggleGlobalExpand()" class="btn btn-ghost text-xl border-2 border-black rounded-xl px-6">
                    ${globalExpanded ? 'Collapse All' : 'Expand All'}
                </button>
            ` : ''}
        </div>

        <div class="max-w-[1600px] mx-auto px-8 mb-20 space-y-20">
            ${Object.entries(categories).map(([category, catApps]) => {
                const color = getCategoryColor(category);
                const isExpanded = globalExpanded || expandedSections.has(category);
                const displayApps = isExpanded ? catApps : catApps.slice(0, 5);
                const hasMore = catApps.length > 5;

                return `
                <div class="category-section">
                    <div class="inline-block px-10 py-3 rounded-t-[40px] mb-[-1px]" style="background-color: ${color}">
                        <h2 class="text-3xl font-mono uppercase font-black text-white drop-shadow-sm">${category}</h2>
                    </div>
                    <div class="p-8 rounded-r-[60px] rounded-bl-[60px] shadow-sm relative" style="background-color: ${color}">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                            ${displayApps.map(app => `
                                <div class="bg-white/80 backdrop-blur-sm rounded-[35px] p-8 text-center flex flex-col h-full relative border-2 border-transparent hover:border-white transition-all shadow-lg hover:shadow-2xl group">
                                    <div class="absolute top-5 right-5 cursor-pointer opacity-30 group-hover:opacity-100 transition-opacity" onclick="window.showDetails('${app.name}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                        </svg>
                                    </div>
                                    <div class="w-[120px] h-[120px] bg-black rounded-[28px] mx-auto mb-6 flex items-center justify-center overflow-hidden p-3 shadow-xl">
                                        <img src="${app.icon_link || 'https://picsum.photos/120/120'}" class="w-full h-full object-contain" />
                                    </div>
                                    <h3 class="text-3xl font-bold mb-2">${app.title}</h3>
                                    <p class="text-xl mb-2 opacity-80 leading-tight h-12 overflow-hidden">${app.tagline || ''}</p>
                                    <p class="text-lg italic mb-6 opacity-60 h-14 overflow-hidden">${app.replaces ? `Replaces: ${app.replaces}` : ''}</p>
                                    
                                    <button 
                                        ${app.hasTemplate ? `onclick="window.toggleApp('${app.name}')"` : 'disabled'}
                                        class="mt-auto w-full py-4 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 ${!app.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : app.installed ? 'bg-black border-black text-white scale-[0.98] opacity-40' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl'}"
                                    >
                                        ${!app.hasTemplate ? 'TBD' : app.installed ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${hasMore ? `
                            <div class="flex justify-center mt-10">
                                <button onclick="window.toggleSection('${category}')" class="bg-white/90 backdrop-blur-sm border-[4px] border-white text-gray-800 font-bold py-3 px-12 rounded-[25px] text-2xl shadow-lg hover:scale-105 transition-transform">
                                    ${isExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    updateOverlay();
}

async function renderServicesPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    const services = await db.services.toArray();
    const volumes = await db.volumes.toArray();
    const installedApps = await db.apps.where('installed').equals(1).toArray();

    content.innerHTML = `
        <div class="max-w-6xl mx-auto px-8 py-20">
            <h1 class="text-6xl font-bold mb-12">Services & Volumes</h1>
            
            <div class="space-y-16">
                <section>
                    <h2 class="text-4xl font-bold mb-8 text-[#0088ff]">Global Services</h2>
                    <div class="space-y-8">
                        ${services.map(s => renderServiceVolumeCard(s, 'service', installedApps)).join('')}
                    </div>
                </section>

                <section>
                    <h2 class="text-4xl font-bold mb-8 text-[#0088ff]">Volumes</h2>
                    <div class="space-y-8">
                        ${volumes.map(v => renderServiceVolumeCard(v, 'volume', installedApps)).join('')}
                    </div>
                </section>
            </div>
        </div>
    `;
    updateOverlay();
}

function renderServiceVolumeCard(item: any, type: 'service' | 'volume', installedApps: AppEntry[]) {
    return `
        <div class="bg-white border-[5px] border-black rounded-[30px] p-8 shadow-xl">
            <div class="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div class="flex-1">
                    <h3 class="text-4xl font-bold mb-2">${item.title}</h3>
                    <p class="text-2xl text-gray-600 mb-6">${item.description}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${item.fields_def.map((f: any) => `
                            <div class="form-control">
                                <label class="label"><span class="label-text text-xl font-bold">${f.label}</span></label>
                                <input type="${f.type}" value="${item.fields[f.name] || ''}" onchange="window.updateField('${type}', '${item.name}', '${f.name}', this.value)" placeholder="${f.placeholder}" class="input input-bordered input-lg border-2 border-black rounded-xl" />
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="w-full lg:w-auto flex flex-col gap-4">
                    <button onclick="window.applyAll('${type}', '${item.name}')" class="btn btn-lg bg-[#efeef6] border-[#0088ff] text-[#0088ff] border-[4px] rounded-xl text-xl">Apply to All</button>
                    <button onclick="window.deapplyAll('${type}', '${item.name}')" class="btn btn-lg bg-white border-gray-400 text-gray-500 border-[4px] rounded-xl text-xl">Deapply All</button>
                    
                    <div class="dropdown dropdown-end w-full">
                        <button tabindex="0" class="btn btn-lg bg-black text-white w-full border-none rounded-xl text-xl">Custom</button>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-4 shadow-2xl bg-base-100 rounded-box w-80 border-2 border-black mt-2">
                            <li class="menu-title text-black text-lg">Select Apps</li>
                            ${installedApps.map(app => `
                                <li>
                                    <label class="flex justify-between items-center py-3">
                                        <span class="text-lg">${app.title}</span>
                                        <input type="checkbox" class="checkbox checkbox-primary border-2" 
                                            ${(type === 'service' ? app.services : app.volumes).includes(item.name) ? 'checked' : ''} 
                                            onchange="window.toggleCustom('${type}', '${item.name}', '${app.name}', this.checked)" />
                                    </label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderInstallPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div class="max-w-4xl mx-auto px-8 py-20 space-y-20">
            <h1 class="text-6xl font-bold text-center mb-16">Final Steps</h1>
            
            <div class="space-y-12">
                <div class="flex gap-8 items-start">
                    <div class="w-20 h-20 bg-[#0088ff] text-white rounded-full flex items-center justify-center text-4xl font-bold shrink-0">1</div>
                    <div>
                        <h3 class="text-4xl font-bold mb-4">Review Configuration</h3>
                        <p class="text-2xl text-gray-600">Ensure all your apps, services, and volumes are configured correctly.</p>
                    </div>
                </div>

                <div class="flex gap-8 items-start">
                    <div class="w-20 h-20 bg-[#0088ff] text-white rounded-full flex items-center justify-center text-4xl font-bold shrink-0">2</div>
                    <div class="flex-1">
                        <h3 class="text-4xl font-bold mb-4">Download Config</h3>
                        <p class="text-2xl text-gray-600 mb-6">Get your Nix configuration file for manual installation.</p>
                        <button onclick="window.downloadConfig()" class="btn btn-lg bg-[#efeef6] border-[#0088ff] text-[#0088ff] border-[4px] rounded-xl px-10">Download config.nix</button>
                    </div>
                </div>

                <div class="flex gap-8 items-start">
                    <div class="w-20 h-20 bg-[#0088ff] text-white rounded-full flex items-center justify-center text-4xl font-bold shrink-0">3</div>
                    <div class="flex-1">
                        <h3 class="text-4xl font-bold mb-4">Generate ISO</h3>
                        <p class="text-2xl text-gray-600 mb-6">Build a custom bootable image with everything pre-configured.</p>
                        <button onclick="window.getDownloadLink()" id="iso-btn" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-xl px-10">Download</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    updateOverlay();

    if (sessionStorage.getItem('homelabinator_auto_build') === 'true') {
        sessionStorage.removeItem('homelabinator_auto_build');
        (window as any).getDownloadLink();
    }
}

// --- Global Actions ---

(window as any).toggleSection = (category: string) => {
    if (expandedSections.has(category)) expandedSections.delete(category);
    else expandedSections.add(category);
    render();
};

(window as any).toggleGlobalExpand = () => {
    globalExpanded = !globalExpanded;
    if (!globalExpanded) expandedSections.clear();
    render();
};

(window as any).toggleApp = async (name: string) => {
    const app = await db.apps.get({ name });
    if (app && app.hasTemplate) {
        await appStore.setAppInstalled(name, !app.installed);
        render();
        (window as any).showDetails(app.name);
    }
};

(window as any).updateField = async (type: string, itemName: string, fieldName: string, value: string) => {
    if (type === 'service') {
        const s = await db.services.get({ name: itemName });
        if (s) {
            s.fields[fieldName] = value;
            await db.services.put(s);
        }
    } else {
        const v = await db.volumes.get({ name: itemName });
        if (v) {
            v.fields[fieldName] = value;
            await db.volumes.put(v);
        }
    }
};

(window as any).applyAll = async (type: string, itemName: string) => {
    const apps = await db.apps.where('installed').equals(1).toArray();
    for (const app of apps) {
        const list = type === 'service' ? app.services : app.volumes;
        if (!list.includes(itemName)) list.push(itemName);
        await db.apps.put(app);
    }
    render();
};

(window as any).deapplyAll = async (type: string, itemName: string) => {
    const apps = await db.apps.toArray();
    for (const app of apps) {
        const list = type === 'service' ? app.services : app.volumes;
        const idx = list.indexOf(itemName);
        if (idx > -1) list.splice(idx, 1);
        await db.apps.put(app);
    }
    render();
};

(window as any).toggleCustom = async (type: string, itemName: string, appName: string, checked: boolean) => {
    const app = await db.apps.get({ name: appName });
    if (app) {
        const list = type === 'service' ? app.services : app.volumes;
        if (checked && !list.includes(itemName)) list.push(itemName);
        if (!checked) {
            const idx = list.indexOf(itemName);
            if (idx > -1) list.splice(idx, 1);
        }
        await db.apps.put(app);
    }
};

(window as any).downloadConfig = async () => {
    const config = await appStore.generateConfig();
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.nix';
    a.click();
};

(window as any).getDownloadLink = async () => {
    const isInstallPage = currentPage === 'install';
    
    if (!isInstallPage) {
        console.log("Initiating build and navigating to install page...");
        try {
            const config = await appStore.generateConfig();
            sessionStorage.setItem('homelabinator_config', config);
            sessionStorage.setItem('homelabinator_auto_build', 'true');
            setPage('install');
        } catch (error) {
            console.error("Error generating config:", error);
        }
        return;
    }
    
    // On Install Page
    const config = sessionStorage.getItem('homelabinator_config');
    const downloadBtn = Array.from(document.querySelectorAll('.action-btn'))
        .find(btn => btn.textContent.trim() === 'Download') as HTMLButtonElement || document.getElementById('iso-btn') as HTMLButtonElement;
    
    if (!downloadBtn) {
        console.error("Download button not found.");
        return;
    }

    if (!config) {
        console.error("No config found in session storage.");
        downloadBtn.innerHTML = "Error: No Config";
        return;
    }

    const originalContent = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <span class="loading loading-spinner"></span>
        Your ISO is being built...
    `;

    try {
        const formData = new FormData();
        const blob = new Blob([config], { type: 'text/plain' });
        formData.append('file', blob, 'text-snippet.txt');

        const response = await fetch('https://api.homelabinator.com/generate-iso', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        if (data.url) {
            downloadBtn.innerHTML = 'Download Ready';
            downloadBtn.disabled = false;
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = data.url;
            };
        } else {
            throw new Error('No URL in response');
        }
    } catch (error) {
        console.error("Error building ISO:", error);
        downloadBtn.innerHTML = 'Error Building ISO';
        downloadBtn.disabled = false;
        setTimeout(() => { downloadBtn.innerHTML = originalContent; }, 3000);
    }
};

(window as any).showDetails = async (name: string) => {
    const app = await db.apps.get({ name });
    if (!app) return;
    const modal = document.getElementById('app-modal') as HTMLDialogElement;
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="bg-white border-[5px] border-black rounded-[23px] p-10 flex flex-col lg:flex-row gap-10 max-w-6xl w-full relative">
            <form method="dialog"><button class="absolute top-5 right-5 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center text-2xl">✕</button></form>
            <div class="flex-1">
                <div class="flex items-center gap-8 mb-10">
                    <div class="w-[120px] h-[120px] bg-black rounded-[23px] flex items-center justify-center overflow-hidden p-4">
                        <img src="${app.icon_link || 'https://picsum.photos/120/120'}" class="w-full h-full object-contain" />
                    </div>
                    <h1 class="text-7xl lg:text-8xl font-bold">${app.title}</h1>
                </div>
                <p class="text-3xl lg:text-4xl leading-snug mb-6">${app.tagline || ''}</p>
                <div class="prose prose-xl max-w-none mb-10 text-gray-700">${app.content}</div>
                <div class="flex flex-wrap gap-4">
                    <a href="${app.website || '#'}" target="_blank" class="btn btn-lg bg-[#efeef6] border-[#0088ff] text-[#0088ff]">Website</a>
                </div>
            </div>
            <div class="lg:w-[400px]">
                <img src="${app.screenshots?.[0] || 'https://picsum.photos/800/600'}" class="rounded-[23px] mb-6 shadow-lg" />
                <button 
                    ${app.hasTemplate ? `onclick="window.toggleApp('${app.name}')"` : 'disabled'}
                    class="mt-auto w-full py-4 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 ${!app.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : app.installed ? 'bg-black border-black text-white scale-[0.98] opacity-40' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl'}"
                >
                    ${!app.hasTemplate ? 'TBD' : app.installed ? 'Added' : 'Add'}
                </button>
            </div>
        </div>
    `;
    modal.showModal();
};

(window as any).navigateNext = () => {
    if (currentPage === 'apps') setPage('services');
    else if (currentPage === 'services') (window as any).getDownloadLink();
};

function updateOverlay() {
    const nextBtn = document.getElementById('next-button-container');
    if (!nextBtn) return;
    if (currentPage === 'install') {
        nextBtn.classList.add('hidden');
    } else {
        db.apps.where('installed').equals(1).count().then(count => {
            if (count > 0) nextBtn.classList.remove('hidden');
            else nextBtn.classList.add('hidden');
        });
    }
}

async function render() {
    if (currentPage === 'apps') await renderAppsPage((document.getElementById('app-search') as HTMLInputElement)?.value || '');
    else if (currentPage === 'services') await renderServicesPage();
    else if (currentPage === 'install') await renderInstallPage();
}

async function start() {
    await appStore.init();
    await render();

    document.getElementById('app-search')?.addEventListener('input', (e) => {
        if (currentPage === 'apps') renderAppsPage((e.target as HTMLInputElement).value);
    });
}

window.addEventListener('DOMContentLoaded', start);
