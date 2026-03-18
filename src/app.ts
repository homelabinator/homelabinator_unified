import { registerHooks } from './hooks';
import { appStore } from './store';
import { render, renderAppsPage, setPage } from './ui/renderers';
import { currentPage, getPageFromUrl } from './ui/router';
import './ui/actions'; // Import to register window actions
import './style.css';

async function start() {
    registerHooks();
    await appStore.init();
    setPage(getPageFromUrl());

    document.getElementById('app-search')?.addEventListener('input', (e) => {
        if (currentPage === 'apps') renderAppsPage((e.target as HTMLInputElement).value);
    });
    window.addEventListener('popstate', async () => {
        setPage(getPageFromUrl());
    });
}

window.addEventListener('DOMContentLoaded', start);
