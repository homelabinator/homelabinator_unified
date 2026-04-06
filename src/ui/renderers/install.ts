import { updateOverlay } from './common';

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
                    
                    <div class="dropdown dropdown-top dropdown-end mt-5">
                        <div class="flex">
                            <button onclick="window.getDownloadLink()" id="iso-btn" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-l-xl rounded-r-none px-10">Build ISO</button>
                            <div tabindex="0" role="button" class="btn btn-lg bg-[#0066cc] text-white border-none rounded-r-xl rounded-l-none px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 border-2 border-black mb-2">
                            <li><a onclick="window.downloadConfig('snippet')">Download Nix Snippet</a></li>
                            <li><a onclick="window.downloadConfig('config')">Download Nix Config</a></li>
                            <li><a onclick="window.downloadConfig('vm')">Download VM Testing Config</a></li>
                        </ul>
                    </div>
                    
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
}
