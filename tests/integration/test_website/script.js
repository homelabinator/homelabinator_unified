import { AppStore, db } from '/dist/appstore.js';

const appStore = AppStore.getInstance();
const appsList = document.getElementById('apps-list');
const appDetails = document.getElementById('app-details');
const generateConfigBtn = document.getElementById('generate-config');
const downloadConfigBtn = document.getElementById('download-config');
const configOutput = document.getElementById('config-output');

async function renderApps() {
    const apps = await db.apps.toArray();
    appsList.innerHTML = '';
    for (const app of apps) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${app.name}" id="app-${app.name}" ${app.installed ? 'checked' : ''}>
                <label class="form-check-label" for="app-${app.name}">
                    ${app.name}
                </label>
            </div>
        `;
        div.querySelector('input').addEventListener('change', async (e) => {
            await appStore.setAppInstalled(e.target.value, e.target.checked);
            renderAppDetails();
        });
        appsList.appendChild(div);
    }
}

async function renderAppDetails() {
    const installedApps = await db.apps.where('installed').equals(1).toArray();
    appDetails.innerHTML = '';
    for (const app of installedApps) {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${app.name}</h3>
            <h4>Services</h4>
            <div id="services-${app.name}"></div>
            <h4>Volumes</h4>
            <div id="volumes-${app.name}"></div>
            <h4>Fields</h4>
            <div id="fields-${app.name}"></div>
        `;
        appDetails.appendChild(div);
        renderServices(app);
        renderVolumes(app);
    }
}

async function renderServices(app) {
    const servicesDiv = document.getElementById(`services-${app.name}`);
    if (!servicesDiv) return;
    servicesDiv.innerHTML = ''; // Clear previous content
    const allServices = await db.services.toArray();
    
    for (const service of allServices) {
        const isAdded = app.services && app.services.some(s => s.name === service.name);
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${service.name}" id="service-${app.name}-${service.name}" ${isAdded ? 'checked' : ''}>
                <label class="form-check-label" for="service-${app.name}-${service.name}">
                    ${service.name}
                </label>
            </div>
            <div id="service-fields-${app.name}-${service.name}" class="ms-4"></div>
        `;
        const checkbox = div.querySelector('input');
        if (checkbox) {
            checkbox.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await appStore.addServiceToApp(app.name, e.target.value);
                } else {
                    await appStore.removeServiceFromApp(app.name, e.target.value);
                }
                renderServiceFields(app, service, e.target.checked);
                // Re-render app details to update the app.services array in the displayed app object
                renderAppDetails();
            });
        }
        servicesDiv.appendChild(div);
        if(isAdded) {
            renderServiceFields(app, service, true);
        }
    }
}

async function renderServiceFields(app, service, isAdded) {
    const serviceFieldsDiv = document.getElementById(`service-fields-${app.name}-${service.name}`);
    if (!serviceFieldsDiv) return;
    serviceFieldsDiv.innerHTML = '';
    
    if (isAdded) {
        // Example for 'tailscale' service fields
        if (service.name === 'tailscale') {
            const currentService = await appStore.getService(service.name); // Get the latest service data
            const clientId = currentService?.fields?.clientId || '';
            const clientSecret = currentService?.fields?.clientSecret || '';

            serviceFieldsDiv.innerHTML = `
                <div class="mb-3">
                    <label for="clientId-${app.name}-${service.name}" class="form-label">Client ID</label>
                    <input type="text" class="form-control" id="clientId-${app.name}-${service.name}" value="${clientId}">
                </div>
                <div class="mb-3">
                    <label for="clientSecret-${app.name}-${service.name}" class="form-label">Client Secret</label>
                    <input type="text" class="form-control" id="clientSecret-${app.name}-${service.name}" value="${clientSecret}">
                </div>
            `;
            serviceFieldsDiv.querySelectorAll('input').forEach(input => {
                input.addEventListener('change', async (e) => {
                    const fieldName = e.target.id.split('-')[0];
                    await appStore.setServiceFields(service.name, { [fieldName]: e.target.value });
                });
            });
        }
        // Add more service-specific fields here as needed
    }
}

async function renderVolumes(app) {
    const volumesDiv = document.getElementById(`volumes-${app.name}`);
    if (!volumesDiv) return;
    volumesDiv.innerHTML = ''; // Clear previous content
    const allVolumes = await db.volumes.toArray();

    for (const volume of allVolumes) {
        const isAdded = app.volumes && app.volumes.some(v => v.name === volume.name);
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${volume.name}" id="volume-${app.name}-${volume.name}" ${isAdded ? 'checked' : ''}>
                <label class="form-check-label" for="volume-${app.name}-${volume.name}">
                    ${volume.name}
                </label>
            </div>
            <div id="volume-fields-${app.name}-${volume.name}" class="ms-4"></div>
        `;
        const checkbox = div.querySelector('input');
        if (checkbox) {
            checkbox.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await appStore.addVolumeToApp(app.name, e.target.value);
                } else {
                    await appStore.removeVolumeFromApp(app.name, e.target.value);
                }
                renderVolumeFields(app, volume, e.target.checked);
                // Re-render app details to update the app.volumes array in the displayed app object
                renderAppDetails();
            });
        }
        volumesDiv.appendChild(div);
        if (isAdded) {
            renderVolumeFields(app, volume, true);
        }
    }
}

async function renderVolumeFields(app, volume, isAdded) {
    const volumeFieldsDiv = document.getElementById(`volume-fields-${app.name}-${volume.name}`);
    if (!volumeFieldsDiv) return;
    volumeFieldsDiv.innerHTML = '';
    
    if(isAdded) {
        // For 'config' volume, allow setting a path
        if (volume.name === 'config') {
            const currentVolume = await appStore.getVolume(volume.name); // Get the latest volume data
            const path = currentVolume?.fields?.path || '';
            volumeFieldsDiv.innerHTML = `
                <div class="mb-3">
                    <label for="path-${app.name}-${volume.name}" class="form-label">Path</label>
                    <input type="text" class="form-control" id="path-${app.name}-${volume.name}" value="${path}">
                </div>
            `;
            volumeFieldsDiv.querySelector('input')?.addEventListener('change', async (e) => {
                await appStore.setVolumeFields(volume.name, { path: e.target.value });
            });
        }
        // Add more volume-specific fields here as needed
    }
}

generateConfigBtn.addEventListener('click', async () => {
    const config = await appStore.generateConfig();
    configOutput.textContent = config;
});

downloadConfigBtn.addEventListener('click', () => {
    const config = configOutput.textContent;
    if (config) {
        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.nix';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});


(async () => {
    await appStore.init();
    await renderApps();
    await renderAppDetails();
})();
