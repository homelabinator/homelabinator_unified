export type Page = 'apps' | 'services' | 'install';

export let currentPage: Page = 'apps';

export function setCurrentPage(page: Page) {
    currentPage = page;
    const path = page === 'apps' ? '/' : `/${page}`;
    if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
    }
}

export function getPageFromUrl(): Page {
    const path = window.location.pathname;
    if (path === '/services') return 'services';
    if (path === '/install') return 'install';
    return 'apps';
}
