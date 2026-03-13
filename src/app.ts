import { registerHooks } from './hooks';
import { appStore } from './store';
import { render, renderAppsPage } from './ui/renderers';
import { currentPage } from './ui/router';
import './ui/actions'; // Import to register window actions
import './style.css';

async function start() {
    registerHooks();
    await appStore.init();
    await render();

    document.getElementById('app-search')?.addEventListener('input', (e) => {
        if (currentPage === 'apps') renderAppsPage((e.target as HTMLInputElement).value);
    });
}

window.addEventListener('DOMContentLoaded', start);
