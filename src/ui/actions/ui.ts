import { db } from '../../db';
import { 
    render, 
    setPage, 
    expandedSections, 
    setGlobalExpanded, 
    globalExpanded, 
    resetExpandedSections
} from '../renderers/common';
import { currentPage, previousPage } from '../router';

(window as any).setPage = setPage;

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

        const installedApps = await db.registry.where('type').equals('app').and(x => x.installed === 1).toArray();
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

        const enabledServices = await db.registry.where('type').equals('service').and(x => x.onByDefault === true).toArray();
        for (const s of enabledServices) {
            for (const f of s.fields_def || []) {
                if (f.required && !s.fields[f.name]) {
                    alert(`Service "${s.title}" field "${f.label}" is required.`);
                    (window as any).openSettings('service', s.name);
                    return;
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

(window as any).navigateNext = navigateNext;
(window as any).navigateBack = navigateBack;
