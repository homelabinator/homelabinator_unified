import Dexie, { type Table } from 'dexie';

export interface AppEntry {
    id?: number;
    name: string; // slug
    title: string;
    handlebars_config: string;
    installed: number;
    category?: string;
    replaces?: string;
    tagline?: string;
    docs_link?: string;
    screenshots?: string[];
    icon_link?: string;
    website?: string;
    content: string;
    hasTemplate: boolean;
    services: string[]; // List of service names applied
    volumes: string[];   // List of volume names applied
    fields: { [key: string]: any };
    github_stars?: string;
    docker_downloads?: string;
}

export interface ServiceEntry {
    id?: number;
    name: string;
    title: string;
    description: string;
    core_config: string;
    template_config: string;
    fields_def: any[]; // Definition of fields
    fields: { [key: string]: any }; // Current values (for "Apply to All" or default)
}

export interface VolumeEntry {
    id?: number;
    name: string;
    title: string;
    description: string;
    core_config: string;
    template_config: string;
    mount_config: string;
    fields_def: any[];
    fields: { [key: string]: any };
}

export class HomelabDatabase extends Dexie {
    apps!: Table<AppEntry>;
    services!: Table<ServiceEntry>;
    volumes!: Table<VolumeEntry>;

    constructor() {
        super('HomelabDatabase_V3');
        this.version(1).stores({
            apps: '&name, category, installed',
            services: '++id, &name',
            volumes: '++id, &name'
        });
    }
}

export const db = new HomelabDatabase();
