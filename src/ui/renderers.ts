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
    'Other': '#e1bee7'
};
const categoryOrder = ['Entertainment', 'Utility', 'Productivity'];

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
            if(btnVal) btnVal.textContent = "Next";
        });
    } else if (currentPage === 'services') {
        searchContainer?.classList.add('hidden');
        backBtn?.classList.remove('hidden');
        nextBtn?.classList.remove('hidden');
        if(btnVal) btnVal.textContent = "Skip";
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
        <div class="max-w-4xl mx-auto px-8 py-20 space-y-12">
            <h1 class="text-6xl font-bold text-center mb-16">About Homelabinator</h1>
            
            <div class="prose prose-xl max-w-none">
                <p class="text-2xl leading-relaxed">
                    Homelabinator is the easiest way for you to be able to replace your subscriptions with free alternatives. How you might ask? Through self-hosting.
                </p>

                <h2 class="text-4xl font-bold mt-12 mb-6">What is "self-hosting"?</h2>
                <p class="text-xl opacity-80 leading-relaxed">
                    To understand self-hosting it takes a bit of context on how the internet works. Say you want to listen to music from Spotify. Your phone connects to the internet, and the internet is connected to some server that is hosting "spotify.com".
                </p>

                <div class="my-8">
                    <img src="/assets/about-1.png" alt="About Page Diagram for Using Spotify" class="w-full rounded-[30px] border-2 border-black shadow-lg" />
                    <p class="text-center italic opacity-60 mt-4">(This is a massive over simplification)</p>
                </div>

                <p class="text-xl opacity-80 leading-relaxed">
                    But what if that server was an old computer, that was in your living room? Now it's just a matter of finding the right software that has the same functionality has Spotify. It just so happens there is an excellent equivalent called Navidrome, and not only that, it is free!
                </p>

                <div class="my-8">
                    <img src="/assets/about-2.png" alt="About Page Diagram for Navidrome" class="w-full rounded-[30px] border-2 border-black shadow-lg" />
                </div>

                <p class="text-xl opacity-80 leading-relaxed">
                    This applies to all kinds of services too, not just Spotify. Take a look at the home page to see what all can be replaced!
                </p>

                <h2 class="text-4xl font-bold mt-12 mb-6">Technical Details</h2>
                <p class="text-xl opacity-80 leading-relaxed">
                    If technical jargon scares you, then do not bother reading this, but those who are curious, press on!
                </p>

                <h3 class="text-3xl font-bold mt-12 mb-4">How does Homelabinator work?</h3>
                <p class="text-xl opacity-80 leading-relaxed">
                    Built on the shoulders of the giants that are <a href="https://nixos.org/" target="_blank" class="text-[#0088ff] font-bold">NixOS</a> and <a href="https://k3s.io/" target="_blank" class="text-[#0088ff] font-bold">K3s</a>, Homelabinator is an opinionated customization of NixOS. When you add the apps that you want to self-host, we create an bootable ISO that you can flash onto a USB drive. When you boot your old computer from this USB, it automatically installs the selected software and configures everything for you.
                </p>

                <h3 class="text-3xl font-bold mt-12 mb-4">Minimum Requirements</h3>
                <p class="text-xl opacity-80 leading-relaxed">
                    The following is the minimum requirements for an "old" computer to be able to run Homelabinator.
                </p>

                <div class="bg-[#efeef6] p-8 rounded-[30px] border-2 border-black my-8 overflow-hidden">
                    <table class="w-full text-xl border-collapse">
                        <thead>
                            <tr class="border-b-2 border-black/10">
                                <th class="text-left py-4 px-4 font-bold">Component</th>
                                <th class="text-left py-4 px-4 font-bold">Requirement</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-black/5">
                            <tr><td class="py-4 px-4">CPU</td><td class="py-4 px-4">Dual Core x64</td></tr>
                            <tr><td class="py-4 px-4">Memory</td><td class="py-4 px-4">2GB</td></tr>
                            <tr><td class="py-4 px-4">Storage</td><td class="py-4 px-4">16GB</td></tr>
                            <tr><td class="py-4 px-4">USB Stick*</td><td class="py-4 px-4">2GB</td></tr>
                            <tr><td class="py-4 px-4">Internet Connection</td><td class="py-4 px-4">Required</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="space-y-2">
                    <p class="text-lg opacity-60 italic">*Only needed one time for installing the OS.</p>
                    <p class="text-lg opacity-60 italic text-[#0088ff]">NOTE: The amount of storage varies with the amount of apps that you add.</p>
                </div>

                <h3 class="text-3xl font-bold mt-12 mb-4">Don't trust us?</h3>
                <p class="text-xl opacity-80 leading-relaxed">
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
    apps.sort((a, b) => {
        if (a.hasTemplate && !b.hasTemplate) return -1;
        if (!a.hasTemplate && b.hasTemplate) return 1;
        const starsA = Number(a.github_stars) || 0;
        const starsB = Number(b.github_stars) || 0;
        return starsB - starsA;
    });
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
                <button onclick="window.toggleGlobalExpand()" class="bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl py-3 px-8 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 cursor-pointer">
                    ${globalExpanded ? 'Collapse All' : 'Expand All'}
                </button>
            ` : ''}
        </div>

        <div class="max-w-[1600px] mx-auto px-8 mb-20 space-y-20">
            ${categoryOrder.filter(cat => categories[cat]).map(category => {
                const catApps = categories[category];
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
                                    <h3 class="${app.title.length > 12 ? 'text-2xl' : 'text-3xl'} font-bold mb-2">${app.title}</h3>
                                    <p class="text-xl mb-2 opacity-80 leading-tight h-12 overflow-hidden">${app.tagline || ''}</p>
                                    <p class="text-lg italic mb-6 opacity-60 h-14 overflow-hidden">${app.replaces ? `Replaces: ${app.replaces}` : ''}</p>
                                    
                                    <button 
                                        ${app.hasTemplate ? `onclick="window.toggleApp('${app.name}')"` : 'disabled'}
                                        class="mt-auto w-full py-4 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 ${!app.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : app.installed ? 'bg-black border-black text-white scale-[0.98] opacity-40 cursor-pointer' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl cursor-pointer'}"
                                    >
                                        ${!app.hasTemplate ? 'TBA' : app.installed ? 'Added' : 'Add'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${hasMore ? `
                            <div class="flex justify-center mt-10">
                                <button onclick="window.toggleSection('${category}')" class="bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl py-4 px-12 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 cursor-pointer">
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
                    <h3 class="${item.title.length > 12 ? 'text-2xl' : 'text-4xl'} font-bold mb-2">${item.title}</h3>
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
                    <button onclick="window.getDownloadLink()" id="iso-btn" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-xl px-10 mt-5">Download</button>
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

    if (sessionStorage.getItem('homelabinator_auto_build') === 'true') {
        sessionStorage.removeItem('homelabinator_auto_build');
        (window as any).getDownloadLink();
    }
}

export async function render() {
    if (currentPage === 'apps') await renderAppsPage((document.getElementById('app-search') as HTMLInputElement)?.value || '');
    else if (currentPage === 'services') await renderServicesPage();
    else if (currentPage === 'install') await renderInstallPage();
    else if (currentPage === 'about') await renderAboutPage();
}

export function setPage(page: any) {
    setCurrentPage(page);
    render();
    window.scrollTo(0, 0);
}

export function navigateNext() {
    if (currentPage === 'apps') setPage('services');
    else if (currentPage === 'services') (window as any).getDownloadLink();
}

export function navigateBack() {
    if (currentPage === 'about') setPage(previousPage);
    else if (currentPage === 'services') setPage('apps');
    else if (currentPage === 'install') setPage('services');
}
