import Handlebars from 'handlebars';
import { type RegistryEntry } from './db';

// --- Session State for Hooks ---

export let sessionPorts: Record<string, any[]> = {};
export let sessionVolumes: Record<string, any[]> = {};
export let globalAllVolumes: RegistryEntry[] = [];

export function resetSession() {
    sessionPorts = {};
    sessionVolumes = {};
}

export function setGlobalVolumes(volumes: RegistryEntry[]) {
    globalAllVolumes = volumes;
}

// --- Handlebars Helpers for Hooks ---

export function registerHooks() {
    Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
    });

    Handlebars.registerHelper('hook_port', function(port, name, options) {
        const appName = this.app.name;
        if (!sessionPorts[appName]) sessionPorts[appName] = [];
        const protocol = (options.hash && options.hash.protocol) || 'TCP';
        sessionPorts[appName].push({ port, name, protocol });
        let res = `{ containerPort = ${port}; name = "${name}"; `;
        if (protocol !== 'TCP') res += `protocol = "${protocol}"; `;
        res += `}`;
        return new Handlebars.SafeString(res);
    });

    Handlebars.registerHelper('hook_volume', function(name, mountPath) {
        const appName = this.app.name;
        if (!sessionVolumes[appName]) sessionVolumes[appName] = [];
        sessionVolumes[appName].push({ name, mountPath });
        return new Handlebars.SafeString(`{ name = "${name}"; mountPath = "${mountPath}"; }`);
    });

    Handlebars.registerHelper('hook_volumes_pod', function() {
        const app = this.app;
        const volumes = sessionVolumes[app.name] || [];
        let res = '';
        
        const vService = globalAllVolumes.find(v => v.name === 'hostPath');
        if (!vService || !vService.template_config) return '';

        const template = Handlebars.compile(vService.template_config);
        
        for (const v of volumes) {
            res += template({
                app: app,
                volume: v,
                fields: vService.fields
            }) + '\n';
        }
        return new Handlebars.SafeString(res.trimEnd());
    });
}
