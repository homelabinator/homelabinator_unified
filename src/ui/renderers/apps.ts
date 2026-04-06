import { db } from '../../db';
import { globalExpanded, expandedSections, categoryOrder, getCategoryColor, updateOverlay } from './common';

export async function renderAppsPage(filter = '') {
    const appGrid = document.getElementById('main-content');
    if (!appGrid) return;

    let items = await db.registry.toArray();

    items.sort((a, b) => {
        if (a.hasTemplate && !b.hasTemplate) return -1;
        if (!a.hasTemplate && b.hasTemplate) return 1;
        const starsA = Number(a.github_stars) || 0;
        const starsB = Number(b.github_stars) || 0;
        return starsB - starsA;
    });

    if (filter) {
        const query = filter.toLowerCase();
        items = items.filter(item => 
            item.title.toLowerCase().includes(query) || 
            (item.tagline && item.tagline.toLowerCase().includes(query)) ||
            (item.replaces && item.replaces.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query))
        );
    }

    const categories: { [key: string]: any[] } = {};
    items.forEach(item => {
        let cat = item.category || 'Other';
        if (item.type === 'service') cat = 'System';
        if (item.type === 'volume') cat = 'Storage';
        
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
    });

    const displayCategoryOrder = [...categoryOrder, 'Other'].filter(cat => categories[cat]);
    const anyCanExpand = Object.values(categories).some(list => list.length > 5);
    const isDev = (process.env as any).ENV_NAME === 'dev';

    appGrid.innerHTML = `
        <div class="text-center py-10 md:py-20 px-5 relative">
            <button onclick="window.openSettings('global')" class="absolute top-10 right-10 bg-white border-black text-black hover:bg-black hover:text-white shadow-md hover:shadow-xl py-2 px-6 rounded-[20px] text-xl font-bold border-4 transition-all duration-300 cursor-pointer flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
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
                                const isInstalled = item.type === 'app' ? item.installed === 1 : (item.type === 'service' ? item.onByDefault : false);
                                return `
                                <div class="bg-white/80 backdrop-blur-sm rounded-[30px] md:rounded-[35px] p-6 md:p-8 text-center flex flex-col h-full relative border-[5px] ${outlineColor} hover:border-white transition-all shadow-lg hover:shadow-2xl group">
                                    <div class="absolute top-5 right-5 cursor-pointer opacity-30 group-hover:opacity-100 transition-opacity" onclick="window.showDetails('${item.name}', '${item.type}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 md:w-8 md:h-8">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                        </svg>
                                    </div>
                                    <div class="absolute top-5 left-5 cursor-pointer opacity-30 group-hover:opacity-100 transition-opacity" onclick="window.openSettings('${item.type}', '${item.name}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 md:w-8 md:h-8">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    </div>
                                    <div class="w-[100px] h-[100px] md:w-[120px] md:h-[120px] bg-black rounded-[20px] md:rounded-[28px] mx-auto mb-6 flex items-center justify-center overflow-hidden p-3 shadow-xl">
                                        <img src="${item.icon_link || 'https://picsum.photos/120/120'}" class="w-full h-full object-contain" />
                                    </div>
                                    <h3 class="${item.title.length > 12 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold mb-2">${item.title}</h3>
                                    <p class="text-lg md:text-xl mb-2 opacity-80 leading-tight h-10 md:h-12 overflow-hidden">${item.tagline || item.description || ''}</p>
                                    <p class="text-base md:text-lg italic mb-6 opacity-60 h-12 md:h-14 overflow-hidden">${item.replaces ? `Replaces: ${item.replaces}` : ''}</p>
                                    
                                    <button 
                                        ${item.hasTemplate || item.type === 'app' ? `onclick="window.toggleApp('${item.name}', '${item.type}')"` : 'disabled'}
                                        class="mt-auto w-full py-3 md:py-4 rounded-[18px] md:rounded-[22px] text-xl md:text-2xl font-bold border-[4px] md:border-[5px] transition-all duration-300 ${(!item.hasTemplate && item.type !== 'app') ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : isInstalled ? 'bg-black border-black text-white scale-[0.98] opacity-40 cursor-pointer' : 'bg-white border-[#0088ff] text-[#0088ff] hover:bg-[#0088ff] hover:text-white shadow-md hover:shadow-xl cursor-pointer'}"
                                    >
                                        ${(!item.hasTemplate && item.type !== 'app') ? 'TBA' : isInstalled ? 'Added' : 'Add'}
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
