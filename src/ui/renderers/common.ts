import { db } from '../../db';
import { currentPage, setCurrentPage, previousPage } from '../router';
import { renderAppsPage } from './apps';
import { renderInstallPage, resetInstallStep, getInstallStep } from './install';
import { renderAboutPage } from './about';

export let expandedSections: Set<string> = new Set();
export let globalExpanded = false;

export const categoryColors: { [key: string]: string } = {
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

export const categoryOrder = ['Entertainment', 'Utility', 'Productivity', 'System', 'Storage'];

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
        db.registry.where('type').equals('app').and(x => x.installed === 1).count().then(count => {
            if (count > 0) nextBtn?.classList.remove('hidden');
            else nextBtn?.classList.add('hidden');
            if(btnVal) btnVal.textContent = "Build ISO";
        });
    } else if (currentPage === 'install') {
        searchContainer?.classList.add('hidden');
        backBtn?.classList.remove('hidden');
        
        const step = getInstallStep();
        if (step < 3) {
            nextBtn?.classList.remove('hidden');
            if (btnVal) btnVal.textContent = "Next";
        } else {
            nextBtn?.classList.add('hidden');
        }
    } else if (currentPage === 'about') {
        searchContainer?.classList.add('hidden');
        backBtn?.classList.remove('hidden');
        nextBtn?.classList.add('hidden');
    }
}

export async function render() {
    if (currentPage === 'apps') await renderAppsPage((document.getElementById('app-search') as HTMLInputElement)?.value || '');
    else if (currentPage === 'install') await renderInstallPage();
    else if (currentPage === 'about') await renderAboutPage();
}

export function setPage(page: any) {
    if (page === 'install' && currentPage !== 'install') {
        resetInstallStep();
    }
    setCurrentPage(page);
    render();
    window.scrollTo(0, 0);
}
