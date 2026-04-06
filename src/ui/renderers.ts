import { db, type AppEntry } from '../db';
import { currentPage, setCurrentPage, previousPage } from './router';

export let expandedSections: Set<string> = new Set();
export let globalExpanded = false;

const categoryColors: { [key: string]: string } = {
    'Entertainment': '#ee5a62',
    'Utility': '#b0e6c3',
    'Media': '#bfbeff',
    'Communication': '#ee5a62',
    'Network': '#ffe082',
    'Security': '#ffab91',
    'Other': '#e1bee7',
    'System': '#90a4ae',
    'Storage': '#a1887f'
};
const categoryOrder = ['Entertainment', 'Utility', 'Productivity', 'System', 'Storage'];

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
    const btnVal = nextBtn?.querySelector("span");
    const searchContainer = document.getElementById('search-container');
    
    if (currentPage === 'apps') {
        searchContainer?.classList.remove('hidden');
        backBtn?.classList.add('hidden');
        db.apps.where('installed').equals(1).count().then(count => {
            if (count > 0) nextBtn?.classList.remove('hidden');
            else nextBtn?.classList.add('hidden');
            if(btnVal) btnVal.textContent = "Build ISO";
        });
    } else if (currentPage === 'install' || currentPage === 'about') {
        searchContainer?.classList.add('hidden');
        backBtn?.classList.remove('hidden');
        nextBtn?.classList.add('hidden');
    }
}

export async function renderAboutPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-20 space-y-8 md:space-y-12">
            <h1 class="text-4xl md:text-6xl font-bold text-center mb-10 md:mb-16">About Homelabinator</h1>
            
            <div class="prose prose-lg md:prose-xl max-w-none">
                <p class="text-xl md:text-2xl leading-relaxed">
                    Homelabinator is the easiest way for you to be able to replace your subscriptions with free alternatives. How you might ask? Through self-hosting.
                </p>

                <h2 class="text-2xl md:text-4xl font-bold mt-8 md:mt-12 mb-4 md:mb-6">What is "self-hosting"?</h2>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    To understand self-hosting it takes a bit of context on how the internet works. Say you want to listen to music from Spotify. Your phone connects to the internet, and the internet is connected to some server that is hosting "spotify.com".
                </p>

                <div class="my-6 md:my-8">
                    <img src="/assets/about-1.png" alt="About Page Diagram for Using Spotify" class="w-full rounded-[20px] md:rounded-[30px] border-2 border-black shadow-lg" />
                    <p class="text-center italic opacity-60 mt-4 text-sm md:text-base">(This is a massive over simplification)</p>
                </div>

                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    But what if that server was an old computer, that was in your living room? Now it's just a matter of finding the right software that has the same functionality has Spotify. It just so happens there is an excellent equivalent called Navidrome, and not only that, it is free!
                </p>

                <div class="my-6 md:my-8">
                    <img src="/assets/about-2.png" alt="About Page Diagram for Navidrome" class="w-full rounded-[20px] md:rounded-[30px] border-2 border-black shadow-lg" />
                </div>

                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    This applies to all kinds of services too, not just Spotify. Take a look at the home page to see what all can be replaced!
                </p>

                <h2 class="text-2xl md:text-4xl font-bold mt-8 md:mt-12 mb-4 md:mb-6">Technical Details</h2>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    If technical jargon scares you, then do not bother reading this, but those who are curious, press on!
                </p>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">How does Homelabinator work?</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    Built on the shoulders of the giants that are <a href="https://nixos.org/" target="_blank" class="text-[#0088ff] font-bold">NixOS</a> and <a href="https://k3s.io/" target="_blank" class="text-[#0088ff] font-bold">K3s</a>, Homelabinator is an opinionated customization of NixOS. When you add the apps that you want to self-host, we create an bootable ISO that you can flash onto a USB drive. When you boot your old computer from this USB, it automatically installs the selected software and configures everything for you.
                </p>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">Minimum Requirements</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    The following is the minimum requirements for an "old" computer to be able to run Homelabinator.
                </p>

                <div class="bg-[#efeef6] p-4 md:p-8 rounded-[20px] md:rounded-[30px] border-2 border-black my-6 md:my-8 overflow-x-auto">
                    <table class="w-full text-lg md:text-xl border-collapse min-w-[300px]">
                        <thead>
                            <tr class="border-b-2 border-black/10">
                                <th class="text-left py-4 px-2 md:px-4 font-bold">Component</th>
                                <th class="text-left py-4 px-2 md:px-4 font-bold">Requirement</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-black/5">
                            <tr><td class="py-4 px-2 md:px-4">CPU</td><td class="py-4 px-2 md:px-4">Dual Core x64</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Memory</td><td class="py-4 px-2 md:px-4">2GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Storage</td><td class="py-4 px-2 md:px-4">16GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">USB Stick*</td><td class="py-4 px-2 md:px-4">2GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Internet Connection</td><td class="py-4 px-2 md:px-4">Required</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="space-y-2">
                    <p class="text-base md:text-lg opacity-60 italic">*Only needed one time for installing the OS.</p>
                    <p class="text-base md:text-lg opacity-60 italic text-[#0088ff]">NOTE: The amount of storage varies with the amount of apps that you add.</p>
                </div>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">Don't trust us?</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    All of our code is publicly accessible on <a href="https://github.com/homelabinator" target="_blank" class="text-[#0088ff] font-bold">our GitHub organization</a>! Feel free to make any issues or pull requests!
                </p>
            </div>
        </div>
    `;
    updateOverlay();
}

export async function renderAppsPage(filter = '') {
    const appGrid = document.getElementById('main-content');
    if (!appGrid) return;

    let apps = await db.apps.toArray();
    let services = await db.services.toArray();
    let volumes = await db.volumes.toArray();

    // Map services and volumes to AppEntry-like objects for rendering
    const allItems: any[] = [
        ...apps.map(a => ({ ...a, type: 'app' })),
        ...services.map(s => ({ 
            ...s, 
            type: 'service', 
            category: 'System', 
            tagline: s.description, 
            hasTemplate: true,
            installed: s.onByDefault || false // Placeholder for "installed" state for services
        })),
        ...volumes.map(v => ({ 
            ...v, 
            type: 'volume', 
            category: 'Storage', 
            tagline: v.description, 
            hasTemplate: true,
            installed: false 
        }))
    ];

    allItems.sort((a, b) => {
        if (a.hasTemplate && !b.hasTemplate) return -1;
        if (!a.hasTemplate && b.hasTemplate) return 1;
        const starsA = Number(a.github_stars) || 0;
        const starsB = Number(b.github_stars) || 0;
        return starsB - starsA;
    });

    let filteredItems = allItems;
    if (filter) {
        const query = filter.toLowerCase();
        filteredItems = allItems.filter(item => 
            item.title.toLowerCase().includes(query) || 
            (item.tagline && item.tagline.toLowerCase().includes(query)) ||
            (item.replaces && item.replaces.toLowerCase().includes(query))
        );
    }

    const categories: { [key: string]: any[] } = {};
    filteredItems.forEach(item => {
        const cat = item.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    const displayCategoryOrder = [...categoryOrder, 'System', 'Storage', 'Other'].filter(cat => categories[cat]);
    const anyCanExpand = Object.values(categories).some(list => list.length > 5);
    const isDev = (process.env as any).ENV_NAME === 'dev';

    appGrid.innerHTML = `
        <div class="text-center py-10 md:py-20 px-5 relative">
            <button onclick="window.openSettings('global')" class="absolute top-10 right-10 bg-white border-black text-black hover:bg-black hover:text-white shadow-md hover:shadow-xl py-2 px-6 rounded-[20px] text-xl font-bold border-4 transition-all duration-300 cursor-pointer flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Settings
            </button>
            <h1 class="text-[40px] md:text-[96px] font-bold m-0 leading-tight">Cancel your subscriptions.</h1>
            <h1 class="text-[40px] md:text-[96px] font-bold m-0 leading-tight">Own your apps.</h1>
            <br>
            <p class="text-xl md:text-3xl font-light mt-2.5">Choose free alternatives to your favorite services and we’ll generate a custom, plug-and-play ISO.</p>
            <br>
            <p class="text-l md:text-2xl font-light mt-2.5">Turn any old computer into a self-hosting machine in minutes.</p>
        </div>

        <div class="max-w-[1600px] mx-auto px-8 mb-8 flex justify-end gap-4">
            ${(anyCanExpand && isDev) ? `
                <button onclick="window.toggleGlobalExpand()" class="bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl py-3 px-8 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 cursor-pointer">
                    ${globalExpanded ? 'Collapse All' : 'Expand All'}
                </button>
            ` : ''}
        </div>

        <div class="max-w-[1600px] mx-auto px-4 md:px-8 mb-20 space-y-10 md:space-y-20">
            ${displayCategoryOrder.map(category => {
                const catApps = categories[category];
                const color = getCategoryColor(category);
                const isExpanded = globalExpanded || expandedSections.has(category);
                const displayApps = isExpanded ? catApps : catApps.slice(0, 5);
                const hasMore = catApps.length > 5;

                return `
                <div class="category-section">
                    <div class="inline-block px-6 md:px-10 py-2 md:py-3 rounded-t-[30px] md:rounded-t-[40px] mb-[-1px]" style="background-color: ${color}">
                        <h2 class="text-xl md:text-3xl font-mono uppercase font-black text-white drop-shadow-sm">${category}</h2>
                    </div>
                    <div class="p-4 md:p-8 rounded-r-[40px] md:rounded-r-[60px] rounded-bl-[40px] md:rounded-bl-[60px] shadow-sm relative" style="background-color: ${color}">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8">
                            ${displayApps.map(item => {
                                const isServiceOrVolume = item.type === 'service' || item.type === 'volume';
                                const outlineColor = isServiceOrVolume ? 'border-black' : 'border-transparent';
                                return `
                                <div class="bg-white/80 backdrop-blur-sm rounded-[30px] md:rounded-[35px] p-6 md:p-8 text-center flex flex-col h-full relative border-[5px] ${outlineColor} hover:border-white transition-all shadow-lg hover:shadow-2xl group">
                                    <div class="absolute top-5 right-5 cursor-pointer opacity-30 group-hover:opacity-100 transition-opacity" onclick="window.showDetails('${item.name}', '${item.type}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 md:w-8 md:h-8">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                        </svg>
                                    </div>
                                    <div class="absolute top-5 left-5 cursor-pointer opacity-30 group-hover:opacity-100 transition-opacity" onclick="window.openSettings('${item.type}', '${item.name}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 md:w-8 md:h-8">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    </div>
                                    <div class="w-[100px] h-[100px] md:w-[120px] md:h-[120px] bg-black rounded-[20px] md:rounded-[28px] mx-auto mb-6 flex items-center justify-center overflow-hidden p-3 shadow-xl">
                                        <img src="${item.icon_link || 'https://picsum.photos/120/120'}" class="w-full h-full object-contain" />
                                    </div>
                                    <h3 class="${item.title.length > 12 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold mb-2">${item.title}</h3>
                                    <p class="text-lg md:text-xl mb-2 opacity-80 leading-tight h-10 md:h-12 overflow-hidden">${item.tagline || ''}</p>
                                    <p class="text-base md:text-lg italic mb-6 opacity-60 h-12 md:h-14 overflow-hidden">${item.replaces ? `Replaces: ${item.replaces}` : ''}</p>
                                    
                                    <button 
                                        ${item.hasTemplate ? `onclick="window.toggleApp('${item.name}', '${item.type}')"` : 'disabled'}
                                        class="mt-auto w-full py-3 md:py-4 rounded-[18px] md:rounded-[22px] text-xl md:text-2xl font-bold border-[4px] md:border-[5px] transition-all duration-300 ${!item.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : item.installed ? 'bg-black border-black text-white scale-[0.98] opacity-40 cursor-pointer' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl cursor-pointer'}"
                                    >
                                        ${!item.hasTemplate ? 'TBA' : item.installed ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            `;
                            }).join('')}
                        </div>
                        
                        ${hasMore ? `
                            <div class="flex justify-center mt-10">
                                <button onclick="window.toggleSection('${category}')" class="bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl py-3 md:py-4 px-10 md:px-12 rounded-[18px] md:rounded-[22px] text-xl md:text-2xl font-bold border-[4px] md:border-[5px] transition-all duration-300 cursor-pointer">
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

export async function renderSettingsModal(type: string, name?: string) {
    const modal = document.getElementById('settings-modal') as HTMLDialogElement;
    const content = document.getElementById('settings-content');
    if (!modal || !content) return;

    let title = '';
    let fields: any[] = [];
    let currentValues: any = {};
    let saveAction = '';

    if (type === 'global') {
        title = 'Global Settings';
        const globals = await db.globals.toArray();
        fields = globals.map(g => ({ ...g, label: g.label, name: g.name, type: g.type, placeholder: g.placeholder, required: g.required }));
        currentValues = globals.reduce((acc, g) => ({ ...acc, [g.name]: g.value }), {});
        saveAction = (fieldName: string, value: string) => `window.updateGlobalField('${fieldName}', '${value}')`;
    } else if (type === 'app' && name) {
        const app = await db.apps.get({ name });
        if (!app) return;
        title = `${app.title} Settings`;
        fields = (app as any).fields_def || [];
        currentValues = app.fields || {};
        saveAction = (fieldName: string, value: string) => `window.updateAppField('${name}', '${fieldName}', '${value}')`;
    } else if (type === 'service' && name) {
        const service = await db.services.get({ name });
        if (!service) return;
        title = `${service.title} Settings`;
        fields = service.fields_def || [];
        currentValues = service.fields || {};
        saveAction = (fieldName: string, value: string) => `window.updateField('service', '${name}', '${fieldName}', '${value}')`;
    } else if (type === 'volume' && name) {
        const volume = await db.volumes.get({ name });
        if (!volume) return;
        title = `${volume.title} Settings`;
        fields = volume.fields_def || [];
        currentValues = volume.fields || {};
        saveAction = (fieldName: string, value: string) => `window.updateField('volume', '${name}', '${fieldName}', '${value}')`;
    }

    content.innerHTML = `
        <div class="bg-white border-[5px] border-black rounded-[23px] p-10 flex flex-col gap-8 max-w-4xl w-full relative">
            <form method="dialog"><button class="absolute top-5 right-5 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center text-2xl cursor-pointer">✕</button></form>
            <h1 class="text-4xl font-bold mb-4">${title}</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${fields.length > 0 ? fields.map(f => {
                    let onchange = '';
                    if (type === 'global') onchange = `window.updateGlobalField('${f.name}', this.value)`;
                    else if (type === 'app') onchange = `window.updateAppField('${name}', '${f.name}', this.value)`;
                    else onchange = `window.updateField('${type}', '${name}', '${f.name}', this.value)`;
                    
                    return `
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text text-xl font-bold">${f.label}${f.required ? ' <span class="text-red-500">*</span>' : ''}</span>
                        </label>
                        <input 
                            type="${f.type || 'text'}" 
                            value="${currentValues[f.name] || ''}" 
                            placeholder="${f.placeholder || ''}" 
                            ${f.required ? 'required' : ''}
                            onchange="${onchange}" 
                            class="input input-bordered input-lg border-2 border-black rounded-xl" 
                        />
                    </div>
                `;}).join('') : '<p class="text-xl opacity-60">No configurable variables for this item.</p>'}
            </div>
        </div>
    `;
    modal.showModal();
}

export async function renderInstallPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div class="max-w-7xl mx-auto px-8 py-20 space-y-20">
            <h1 class="text-6xl font-bold text-center mb-16">Final Steps</h1>
            <div class="grid grid-cols-4 rounded-[20px] border border-gray-300 mb-10">
                <div class="bg-gray-100 p-6 flex flex-col items-center text-center border-r border-gray-300">
                    <img src="/assets/computer.png" class="rounded-full"/>
                    <h1 class="mt-5 mb-5 text-2xl font-semibold">1. Prepare</h1>
                    <p>Insert a blank USB drive into <strong>this</strong> computer. Locate an old computer you wish to revive. Make sure that the computer you choose has some way to connect to the internet (preferably with an wired ethernet cable).</p>
                </div>
                <div class="bg-gray-100 p-6 flex flex-col items-center text-center border-r border-gray-300">
                    <img src="/assets/dl.svg" class="rounded-full"/>
                    <h1 class="mt-5 mb-5 text-2xl font-semibold">2. Install Balena Etcher</h1>
                    <p>To install Homelabinator on your old computer, you need to utilize <u><a href="https://etcher.balena.io/" target="_blank" rel="noopener noreferrer">Balena Etcher</a></u> to prepare your USB. Install it, then come back to this page to download your ISO file.</p>
                    <button onclick="window.open('https://etcher.balena.io', '_blank')" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-xl px-10 mt-5">Download Balena Etcher</button>
                </div>
                <div class="bg-gray-100 p-6 flex flex-col items-center text-center border-r border-gray-300">
                    <img src="/assets/flash.svg" class="rounded-full"/>
                    <h1 class="mt-5 mb-5 text-2xl font-semibold">3. Flash</h1>
                    <p>Download the ISO file using the button below. Then, open Balena Etcher and select the downloaded ISO and your USB drive.</p>
                    
                    <div class="dropdown dropdown-top dropdown-end mt-5">
                        <div class="flex">
                            <button onclick="window.getDownloadLink()" id="iso-btn" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-l-xl rounded-r-none px-10">Build ISO</button>
                            <div tabindex="0" role="button" class="btn btn-lg bg-[#0066cc] text-white border-none rounded-r-xl rounded-l-none px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 border-2 border-black mb-2">
                            <li><a onclick="window.downloadConfig('snippet')">Download Nix Snippet</a></li>
                            <li><a onclick="window.downloadConfig('config')">Download Nix Config</a></li>
                            <li><a onclick="window.downloadConfig('vm')">Download VM Testing Config</a></li>
                        </ul>
                    </div>
                    
                    <progress id="iso-progress" class="progress progress-primary w-full mt-4 hidden" value="0" max="100"></progress>
                </div>
                <div class="bg-gray-100 p-6 flex flex-col items-center text-center">
                    <img src="/assets/retrocomputer.png" class="rounded-full"/>
                    <h1 class="mt-5 mb-5 text-2xl font-semibold">4. Boot</h1>
                    <p>Eject the USB (it is ok if your USB drive is not recognized by your computer) and plug it into the <strong>old</strong> computer. Turn it on and press the key to get into the Boot Menu (typically F12, F2, or Delete).</p>
                </div>
            </div>
        </div>
    `;
    updateOverlay();
}

export async function render() {
    if (currentPage === 'apps') await renderAppsPage((document.getElementById('app-search') as HTMLInputElement)?.value || '');
    else if (currentPage === 'install') await renderInstallPage();
    else if (currentPage === 'about') await renderAboutPage();
}

export function setPage(page: any) {
    setCurrentPage(page);
    render();
    window.scrollTo(0, 0);
}

export async function navigateNext() {
    if (currentPage === 'apps') {
        // Validation
        const globals = await db.globals.toArray();
        for (const g of globals) {
            if (g.required && !g.value) {
                alert(`Global field "${g.label}" is required.`);
                (window as any).openSettings('global');
                return;
            }
        }

        const installedApps = await db.apps.where('installed').equals(1).toArray();
        for (const app of installedApps) {
            const fieldsDef = (app as any).fields_def || [];
            for (const f of fieldsDef) {
                if (f.required && !app.fields[f.name]) {
                    alert(`App "${app.title}" field "${f.label}" is required.`);
                    (window as any).openSettings('app', app.name);
                    return;
                }
            }
        }

        const enabledServices = await db.services.toArray();
        for (const s of enabledServices) {
            if (s.onByDefault) { // Assuming onByDefault means it's enabled for now
                for (const f of s.fields_def) {
                    if (f.required && !s.fields[f.name]) {
                        alert(`Service "${s.title}" field "${f.label}" is required.`);
                        (window as any).openSettings('service', s.name);
                        return;
                    }
                }
            }
        }

        setPage('install');
    }
}

export function navigateBack() {
    if (currentPage === 'about') setPage(previousPage);
    else if (currentPage === 'install') setPage('apps');
}
