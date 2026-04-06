import { db } from '../../db';

(window as any).openSettings = async (type: string, name?: string) => {
    const { renderSettingsModal } = await import('../renderers/settings');
    renderSettingsModal(type, name);
};

(window as any).updateGlobalField = async (name: string, value: string) => {
    const g = await db.globals.get({ name });
    if (g) {
        g.value = value;
        await db.globals.put(g);
    }
};

(window as any).updateAppField = async (appName: string, fieldName: string, value: string) => {
    const app = await db.registry.get({ name: appName });
    if (app) {
        app.fields[fieldName] = value;
        await db.registry.put(app);
    }
};

(window as any).updateField = async (type: string, itemName: string, fieldName: string, value: string) => {
    const item = await db.registry.get({ name: itemName });
    if (item) {
        item.fields[fieldName] = value;
        await db.registry.put(item);
    }
};
