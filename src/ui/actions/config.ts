import { appStore } from '../../store';
import { setPage } from '../renderers/common';
import { currentPage } from '../router';

const API_URL = (process.env as any).ENV_NAME === 'prod' ? 'https://api.homelabinator.com' : 'https://beta-api.homelabinator.com';

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
