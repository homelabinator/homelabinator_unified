export type Page = 'apps' | 'services' | 'install';

export let currentPage: Page = 'apps';

export function setCurrentPage(page: Page) {
    currentPage = page;
}
