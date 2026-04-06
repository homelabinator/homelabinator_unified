import { db } from '../db';
import { appStore } from '../store';
import { 
    render, 
    setPage, 
    expandedSections, 
    setGlobalExpanded, 
    globalExpanded, 
    resetExpandedSections,
    renderAppsPage,
    navigateNext,
    navigateBack
} from './renderers';
import { currentPage } from './router';
(window as any).setPage = setPage;
(window as any).navigateNext = navigateNext;
(window as any).navigateBack = navigateBack;

const API_URL = (process.env as any).ENV_NAME === 'prod' ? 'https://api.homelabinator.com' : 'https://beta-api.homelabinator.com';

const isMobile = () => window.innerWidth < 768;

(window as any).openSettings = async (type: string, name?: string) => {
    const { renderSettingsModal } = await import('./renderers');
    renderSettingsModal(type, name);
};

(window as any).updateGlobalField = async (name: string, value: string) => {
    const g = await db.globals.get({ name });
    if (g) {
        g.value = value;
        await db.globals.put(g);
    }
};

(window as any).updateAppField = async (appName: string, fieldName: string, value: string) => {
    const app = await db.apps.get({ name: appName });
    if (app) {
        app.fields[fieldName] = value;
        await db.apps.put(app);
    }
};

(window as any).toggleSection = (category: string) => {
    if (expandedSections.has(category)) expandedSections.delete(category);
    else expandedSections.add(category);
    render();
};

(window as any).toggleGlobalExpand = () => {
    setGlobalExpanded(!globalExpanded);
    if (!globalExpanded) resetExpandedSections();
    render();
};

(window as any).toggleApp = async (name: string, type: string = 'app') => {
    if (isMobile()) {
        const modal = document.getElementById('mobile-warning-modal') as HTMLDialogElement;
        modal?.showModal();
        return;
    }
    
    if (type === 'app') {
        const app = await db.apps.get({ name });
        if (app && app.hasTemplate) {
            await appStore.setAppInstalled(name, !app.installed);
            const modal = document.getElementById('app-modal') as any;
            if(modal.open) {
                await (window as any).showDetails(name, type);
            }
            await render();
        }
    } else if (type === 'service') {
        const s = await db.services.get({ name });
        if (s) {
            s.onByDefault = !s.onByDefault;
            await db.services.put(s);
            await render();
        }
    } else if (type === 'volume') {
        const v = await db.volumes.get({ name });
        if (v) {
            // Placeholder for volume toggle logic if needed
            await db.volumes.put(v);
            await render();
        }
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

(window as any).downloadConfig = async (type: 'snippet' | 'config' | 'vm' = 'snippet') => {
    const config = await appStore.generateConfig(type);
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
        setPage('install');
        return;
    }
    
    // On Install Page
    const config = await appStore.generateConfig('snippet');
    const downloadBtn = document.getElementById('iso-btn') as HTMLButtonElement;
    const progressBar = document.getElementById('iso-progress') as HTMLProgressElement;
    
    if (!downloadBtn) {
        console.error("Download button not found.");
        return;
    }

    const originalContent = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <span class="loading loading-spinner"></span>
        Building...
    `;
    if (progressBar) {
        progressBar.classList.remove('hidden');
        progressBar.value = 0;
    }

    try {
        const formData = new FormData();
        const blob = new Blob([config], { type: 'text/plain' });
        formData.append('file', blob, 'text-snippet.txt');

        const response = await fetch(`${API_URL}/generate-iso`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('API request failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to start build stream');

        const decoder = new TextDecoder();
        let buffer = '';

        const processSegment = (segment: string) => {
            const lines = segment.split(/\r?\n/);
            let eventType = '';
            let eventData = '';

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    eventType = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                    const data = line.substring(5).trim();
                    eventData += (eventData ? '\n' : '') + data;
                }
            }

            if (eventType === 'progress' && progressBar) {
                const val = parseFloat(eventData);
                if (!isNaN(val)) {
                    progressBar.value = val * 100;
                }
            } else if (eventType === 'completed') {
                downloadBtn.innerHTML = 'Download Ready';
                downloadBtn.disabled = false;
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = eventData;
                };
                if (progressBar) progressBar.classList.add('hidden');
            } else if (eventType === 'error') {
                throw new Error(eventData);
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const segments = buffer.split(/\r?\n\r?\n/);
            buffer = segments.pop() || '';

            for (const segment of segments) {
                if (segment.trim()) processSegment(segment);
            }
        }

        if (buffer.trim()) {
            processSegment(buffer);
        }
    } catch (error) {
        console.error("Error building ISO:", error);
        downloadBtn.innerHTML = 'Error Building ISO';
        downloadBtn.disabled = false;
        if (progressBar) progressBar.classList.add('hidden');
        setTimeout(() => { downloadBtn.innerHTML = originalContent; }, 3000);
    }
};

(window as any).showDetails = async (name: string, type: string = 'app') => {
    let item: any;
    if (type === 'app') item = await db.apps.get({ name });
    else if (type === 'service') item = await db.services.get({ name });
    else if (type === 'volume') item = await db.volumes.get({ name });

    if (!item) return;
    const modal = document.getElementById('app-modal') as HTMLDialogElement;
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    const isInstalled = type === 'app' ? item.installed : (type === 'service' ? item.onByDefault : false);
    const title = item.title;
    const tagline = item.tagline || item.description || '';
    const desc = item.content || item.description || '';
    const website = item.website || '#';
    const screenshots = item.screenshots || ['https://picsum.photos/800/600'];
    const icon = item.icon_link || 'https://picsum.photos/120/120';

    content.innerHTML = `
        <div class="bg-white border-[5px] border-black rounded-[23px] p-10 flex flex-col lg:flex-row gap-10 max-w-6xl w-full relative">
            <form method="dialog"><button class="absolute top-5 right-5 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center text-2xl cursor-pointer">✕</button></form>
            <div class="flex-1">
                <div class="flex items-center gap-8 mb-10">
                    <div class="w-[120px] h-[120px] bg-black rounded-[23px] flex items-center justify-center overflow-hidden p-4">
                        <img src="${icon}" class="w-full h-full object-contain" />
                    </div>
                    <div class="flex-1">
                        <h1 class="${title.length > 12 ? 'text-4xl lg:text-5xl' : 'text-7xl lg:text-8xl'} font-bold">${title}</h1>
                    </div>
                    <button onclick="window.openSettings('${type}', '${name}')" class="bg-white border-black text-black hover:bg-black hover:text-white shadow-md hover:shadow-xl py-2 px-6 rounded-[20px] text-xl font-bold border-4 transition-all duration-300 cursor-pointer flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>
                </div>
                <p class="text-3xl lg:text-4xl leading-snug mb-6">${tagline}</p>
                <div class="prose prose-xl max-w-none mb-10 text-gray-700">${desc}</div>
                <div class="flex flex-wrap gap-4">
                    <a href="${website}" target="_blank" class="btn btn-lg bg-[#efeef6] border-[#0088ff] text-[#0088ff]">Website</a>
                </div>
            </div>
            <div class="lg:w-[400px]">
                <img src="${screenshots[0]}" class="rounded-[23px] mb-6 shadow-lg" />
                <button 
                    ${item.hasTemplate ? `onclick="window.toggleApp('${item.name}', '${type}')"` : 'disabled'}
                    class="mt-auto w-full py-4 rounded-[22px] text-2xl font-bold border-[5px] transition-all duration-300 ${!item.hasTemplate ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : isInstalled ? 'bg-black border-black text-white scale-[0.98] opacity-40 cursor-pointer' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl cursor-pointer'}"
                >
                    ${!item.hasTemplate ? 'TBA' : isInstalled ? 'Added' : 'Add'}
                </button>
                <div class="mt-auto w-full rounded-[22px] border-[5px] border-gray-200 bg-gray-50 p-4 text-lg space-y-1">
                    <div class="flex justify-between">
                        <span class="text-gray-500">GitHub Stars:</span>
                        <span class="font-bold">${item.github_stars || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Docker Downloads:</span>
                        <span class="font-bold">${item.docker_downloads || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.showModal();
};

