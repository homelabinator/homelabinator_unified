import { updateOverlay } from './common';

let currentInstallStep = 0;

export function resetInstallStep() {
    currentInstallStep = 0;
}

export function nextInstallStep() {
    if (currentInstallStep < 3) {
        currentInstallStep++;
        renderInstallPage();
        updateOverlay();
    }
}

export function prevInstallStep() {
    if (currentInstallStep > 0) {
        currentInstallStep--;
        renderInstallPage();
        updateOverlay();
    }
}

export function getInstallStep() {
    return currentInstallStep;
}

const steps = [
    {
        title: "Prepare",
        icon: "/assets/computer.png",
        content: `Insert a blank USB drive into <strong>this</strong> computer. Locate an old computer you wish to revive. Make sure that the computer you choose has some way to connect to the internet (preferably with an wired ethernet cable).`
    },
    {
        title: "Install Balena Etcher",
        icon: "/assets/dl.svg",
        content: `To install Homelabinator on your old computer, you need to utilize <u><a href="https://etcher.balena.io/" target="_blank" rel="noopener noreferrer">Balena Etcher</a></u> to prepare your USB. Install it, then come back to this page to download your ISO file.`,
        action: `<button onclick="window.open('https://etcher.balena.io', '_blank')" class="action-btn btn btn-lg bg-[#0088ff] text-white border-none rounded-xl px-10 mt-5">Download Balena Etcher</button>`
    },
    {
        title: "Flash",
        icon: "/assets/flash.svg",
        content: `Download the ISO file using the button below. Then, open Balena Etcher and select the downloaded ISO and your USB drive.`,
        action: `
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
        `
    },
    {
        title: "Boot",
        icon: "/assets/retrocomputer.png",
        content: `
            Eject the USB (it is ok if your USB drive is not recognized by your computer) and plug it into the <strong>old</strong> computer. Turn it on and press the key to get into the Boot Menu (typically F12, F2, or Delete).
            
            <div class="flex flex-col gap-8 mt-10 text-left w-full">
                <div class="flex flex-col gap-3">
                    <span class="text-2xl font-bold">1. Boot from the USB</span>
                    <p class="text-lg opacity-80 leading-snug">Select your USB drive from the boot menu to start the environment.</p>
                    <div class="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                        <img src="/assets/usb-boot.png" class="h-48 w-full object-contain p-2" />
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <span class="text-2xl font-bold">2. Run the command 'sudo nixos-wizard'</span>
                    <p class="text-lg opacity-80 leading-snug">This starts the installation wizard, follow the directions to install for your system.</p>
                        <img src="/assets/installer.png" class="w-full p-2" />
                </div>
            </div>
        `
    }
];

export async function renderInstallPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    const currentStep = steps[currentInstallStep];

    content.innerHTML = `
        <div class="max-w-6xl mx-auto px-8 py-20">
            <h1 class="text-6xl font-bold text-center mb-16">Final Steps</h1>
            
            <div class="flex flex-col md:flex-row gap-12 items-start">
                <!-- Steps indicator -->
                <div class="w-full md:w-1/3">
                    <ul class="steps steps-vertical w-full">
                        ${steps.map((step, index) => `
                            <li class="step ${index <= currentInstallStep ? 'step-primary' : ''} h-32 text-xl font-semibold">
                                ${step.title}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Step content -->
                <div class="w-full md:w-2/3 bg-gray-100 p-12 rounded-[30px] border border-gray-300 min-h-[400px] flex flex-col items-center text-center">
                    <div class="w-24 h-24 mb-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <img src="${currentStep.icon}" class="w-16 h-16 object-contain"/>
                    </div>
                    <h2 class="text-4xl font-bold mb-6">${currentInstallStep + 1}. ${currentStep.title}</h2>
                    <div class="text-xl leading-relaxed mb-8 max-w-lg">
                        ${currentStep.content}
                    </div>
                    ${currentStep.action || ''}
                </div>
            </div>
        </div>
    `;
    updateOverlay();
}
