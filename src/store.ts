import Handlebars from 'handlebars';
import { db } from './db';
import { sessionPorts, sessionVolumes, setGlobalVolumes, resetSession } from './hooks';

export class AppStore {
    private static instance: AppStore;
    private isInitializing = false;

    private constructor() {}

    public static getInstance(): AppStore {
        if (!AppStore.instance) {
            AppStore.instance = new AppStore();
        }
        return AppStore.instance;
    }

    async init() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            // Clear existing data to ensure we always have the latest from manifest/JSON files on refresh
            await Promise.all([
                db.apps.clear(),
                db.services.clear(),
                db.volumes.clear()
            ]);

            // 1. Populate Services
            const defaultServices: string[] = [];
            try {
                const servicesResponse = await fetch('/src/data/services/manifest.json');
                if (servicesResponse.ok) {
                    const serviceIds = await servicesResponse.json();
                    for (const sId of serviceIds) {
                        try {
                            const metaResponse = await fetch(`/src/data/services/${sId}.json`);
                            if (!metaResponse.ok) throw new Error(`Failed to fetch service meta for ${sId}`);
                            const s = await metaResponse.json();

                            if (s.onByDefault) {
                                defaultServices.push(s.name);
                            }

                            let core = '', tmpl = '';
                            try {
                                const coreResp = await fetch(`/templates/services/${s.name}/core.nix.hbs`);
                                if (coreResp.ok) core = await coreResp.text();
                                const tmplResp = await fetch(`/templates/services/${s.name}/template.nix.hbs`);
                                if (tmplResp.ok) tmpl = await tmplResp.text();
                            } catch (e) {
                                console.warn(`Could not load templates for service ${sId}:`, e);
                            }
                            await db.services.put({ 
                                ...s, 
                                core_config: core, 
                                template_config: tmpl, 
                                fields: {},
                                fields_def: s.fields
                            });
                        } catch (e) {
                            console.error(`Error loading service ${sId}:`, e);
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading service manifest:', e);
            }

            // 2. Populate Apps
            try {
                const response = await fetch('/src/data/apps/manifest.json');
                if (response.ok) {
                    const appIds = await response.json();
                    for (const appId of appIds) {
                        try {
                            const metaResponse = await fetch(`/src/data/apps/${appId}.json`);
                            if (!metaResponse.ok) throw new Error(`Failed to fetch app meta for ${appId}`);
                            const metaData = await metaResponse.json();

                            let nixConfig = '';
                            if (metaData.hasTemplate) {
                                try {
                                    const nixResponse = await fetch(`/templates/apps/${appId}.nix.hbs`);
                                    if (nixResponse.ok) nixConfig = await nixResponse.text();
                                } catch (e) {
                                    console.warn(`Could not load template for app ${appId}:`, e);
                                }
                            }

                            await db.apps.put({
                                ...metaData,
                                name: appId,
                                handlebars_config: nixConfig,
                                installed: 0,
                                services: [...defaultServices],
                                volumes: [],
                                fields: {}
                            });
                        } catch (e) {
                            console.error(`Error loading app ${appId}:`, e);
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading app manifest:', e);
            }

            // 3. Populate Volumes
            try {
                const volumesResponse = await fetch('/src/data/volumes/manifest.json');
                if (volumesResponse.ok) {
                    const volumeIds = await volumesResponse.json();
                    for (const vId of volumeIds) {
                        try {
                            const metaResponse = await fetch(`/src/data/volumes/${vId}.json`);
                            if (!metaResponse.ok) throw new Error(`Failed to fetch volume meta for ${vId}`);
                            const v = await metaResponse.json();

                            let core = '', tmpl = '', mount = '';
                            try {
                                const coreResp = await fetch(`/templates/volumes/${v.name}/core.nix.hbs`);
                                if (coreResp.ok) core = await coreResp.text();
                                const tmplResp = await fetch(`/templates/volumes/${v.name}/template.nix.hbs`);
                                if (tmplResp.ok) tmpl = await tmplResp.text();
                                const mountResp = await fetch(`/templates/volumes/${v.name}/mount.nix.hbs`);
                                if (mountResp.ok) mount = await mountResp.text();
                            } catch (e) {
                                console.warn(`Could not load templates for volume ${vId}:`, e);
                            }
                            await db.volumes.put({ 
                                ...v, 
                                core_config: core, 
                                template_config: tmpl, 
                                mount_config: mount,
                                fields: { path: '/var/lib/homelabinator' },
                                fields_def: v.fields
                            });
                        } catch (e) {
                            console.error(`Error loading volume ${vId}:`, e);
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading volume manifest:', e);
            }

        } finally {
            this.isInitializing = false;
        }
    }

    async setAppInstalled(name: string, installed: boolean) {
        await db.apps.update(name, { installed: installed ? 1 : 0 });
    }

    async generateConfig(): Promise<string> {
        const installedApps = await db.apps.where('installed').equals(1).toArray();
        const coreTemplate = await (await fetch('/templates/core/config.nix.hbs')).text();
        const allServices = await db.services.toArray();
        const allVolumes = await db.volumes.toArray();

        setGlobalVolumes(allVolumes);
        resetSession();

        let appsConfig = '';
        let servicesList = '';
        let volumesList = '';
        let globalServicesConfig = '';
        const usedServiceNames = new Set<string>();
        const usedVolumeNames = new Set<string>();

        // First pass: Render apps to collect ports and volumes via hooks
        for (const app of installedApps) {
            if (app.handlebars_config) {
                const appTemplate = Handlebars.compile(app.handlebars_config);
                appsConfig += appTemplate({ app }) + '\n';
            }
        }

        // Second pass: Render extra services and volumes, and app-specific services
        for (const app of installedApps) {
            const ports = sessionPorts[app.name] || [];
            const appPort = ports[0]?.port || 8080;

            for (const sName of app.services) {
                const s = allServices.find(x => x.name === sName);
                if (s) {
                    usedServiceNames.add(sName);
                    const template = Handlebars.compile(s.template_config);
                    servicesList += template({ 
                        app: { name: app.name, port: appPort }, 
                        fields: { ...s.fields, ...app.fields[sName] }
                    }) + '\n';
                }
            }

            if (sessionVolumes[app.name] && sessionVolumes[app.name].length > 0) {
                usedVolumeNames.add('hostPath');
            }

            const appVolumes = app.volumes.length > 0 ? app.volumes : allVolumes.map(v => v.name);
            for (const vName of appVolumes) {
                usedVolumeNames.add(vName);
                if (vName === 'hostPath') continue;
                const v = allVolumes.find(x => x.name === vName);
                if (v && v.template_config) {
                    const template = Handlebars.compile(v.template_config);
                    const context = { app: { name: app.name }, fields: { ...v.fields, ...app.fields[vName] } };
                    volumesList += template(context) + '\n';
                }
            }

            if (ports.length > 0) {
                servicesList += `
  {
    apiVersion = "v1";
    kind = "Service";
    metadata = {
      name = "${app.name}-svc";
      labels.app = "${app.name}";
    };
    spec = {
      type = "ClusterIP";
      selector.app = "${app.name}";
      ports = [
        ${ports.map(p => `{ port = ${p.port}; targetPort = ${p.port}; name = "${p.name}"; ${p.protocol !== 'TCP' ? `protocol = "${p.protocol}"; ` : ''} }`).join('\n        ')}
      ];
    };
  }\n`;
            }
        }

        let servicesConfig = servicesList ? `\n    services.k3s.manifests.app-services.content = [\n${servicesList}\n    ];\n` : '';
        let volumesConfig = volumesList ? `\n    services.k3s.manifests.app-volumes.content = [\n${volumesList}\n    ];\n` : '';

        for (const s of allServices) {
            if (usedServiceNames.has(s.name) && s.core_config && s.core_config.trim() !== '') {
                const template = Handlebars.compile(s.core_config);
                globalServicesConfig += template({ fields: s.fields, apps: installedApps }) + '\n';
            }
        }

        for (const v of allVolumes) {
            if (usedVolumeNames.has(v.name) && v.core_config && v.core_config.trim() !== '') {
                const template = Handlebars.compile(v.core_config);
                globalServicesConfig += template({ fields: v.fields, apps: installedApps }) + '\n';
            }
        }

        return Handlebars.compile(coreTemplate)({ 
            apps: appsConfig, 
            services: servicesConfig,
            volumes: volumesConfig,
            globalservices: globalServicesConfig 
        });
    }
}

export const appStore = AppStore.getInstance();
