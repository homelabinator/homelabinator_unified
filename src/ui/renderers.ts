import { db, type AppEntry } from '../db';
import { currentPage, setCurrentPage } from './router';

export let expandedSections: Set<string> = new Set();
export let globalExpanded = false;

const categoryColors: { [key: string]: string } = {
    'Utility': '#b0e6c3',
    'Media': '#bfbeff',
    'Communication': '#ee5a62',
    'Network': '#ffe082',
    'Security': '#ffab91',
    'Other': '#e1bee7'
};

export function getCategoryColor(cat: string) {
    return categoryColors[cat] || categoryColors['Other'];
}

export function setGlobalExpanded(val: boolean) {
    globalExpanded = val;
}

export function resetExpandedSections() {
    expandedSections.clear();
}

export function updateOverlay() {
    const nextBtn = document.getElementById('next-button');
    const backBtn = document.getElementById('back-button');
    
    if (currentPage === 'apps') {
        backBtn?.classList.add('hidden');
        db.apps.where('installed').equals(1).count().then(count => {
            if (count > 0) nextBtn?.classList.remove('hidden');
            else nextBtn?.classList.add('hidden');
        });
    } else if (currentPage === 'services') {
        backBtn?.classList.remove('hidden');
        nextBtn?.classList.remove('hidden');
    } else if (currentPage === 'install') {
        backBtn?.classList.remove('hidden');
        nextBtn?.classList.add('hidden');
    }
}

export async function renderAppsPage(filter = '') {
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
            <h1 class="text-[96px] font-bold m-0 leading-tight">The easiest way to selfhost.</h1>
            <p class="text-5xl font-light mt-2.5">Create your own homelab OS</p>
        </div>

        <div class="max-w-[1600px] mx-auto px-8 mb-8 flex justify-end">
            ${anyCanExpand ? `
                <button onclick="window.toggleGlobalExpand()" class="btn btn-ghost text-xl border-2 border-black rounded-xl px-6 cursor-pointer">
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
                                        class="mt-auto w-full py-4 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 ${!app.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : app.installed ? 'bg-black border-black text-white scale-[0.98] opacity-40 cursor-pointer' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl cursor-pointer'}"
                                    >
                                        ${!app.hasTemplate ? 'TBD' : app.installed ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${hasMore ? `
                            <div class="flex justify-center mt-10">
                                <button onclick="window.toggleSection('${category}')" class="bg-white/90 backdrop-blur-sm border-[4px] border-white text-gray-800 font-bold py-3 px-12 rounded-[25px] text-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer">
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

export async function renderServicesPage() {
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
            </div>
        </div>
    `;
    updateOverlay();
}

export function renderServiceVolumeCard(item: any, type: 'service' | 'volume', installedApps: AppEntry[]) {
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

export async function renderInstallPage() {
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

export async function render() {
    if (currentPage === 'apps') await renderAppsPage((document.getElementById('app-search') as HTMLInputElement)?.value || '');
    else if (currentPage === 'services') await renderServicesPage();
    else if (currentPage === 'install') await renderInstallPage();
}

export function setPage(page: any) {
    setCurrentPage(page);
    render();
    window.scrollTo(0, 0);
}
