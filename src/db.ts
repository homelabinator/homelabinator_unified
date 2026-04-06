import Dexie, { type Table } from 'dexie';

export interface RegistryEntry {
    id?: number;
    name: string; // slug
    title: string;
    type: 'app' | 'service' | 'volume';
    
    // App specific
    handlebars_config?: string;
    installed?: number;
    category?: string;
    replaces?: string;
    tagline?: string;
    docs_link?: string;
    screenshots?: string[];
    icon_link?: string;
    website?: string;
    content?: string;
    hasTemplate?: boolean;
    services?: string[]; // List of service names applied
    volumes?: string[];   // List of volume names applied
    github_stars?: string;
    docker_downloads?: string;

    // Service/Volume specific
    description?: string;
    onByDefault?: boolean;
    core_config?: string;
    template_config?: string;
    mount_config?: string;
    fields_def?: any[]; 

    // Common
    fields: { [key: string]: any };
}

export interface GlobalEntry {
    name: string;
    value: any;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
}

export class HomelabDatabase extends Dexie {
    registry!: Table<RegistryEntry>;
    globals!: Table<GlobalEntry>;

    constructor() {
        super('HomelabDatabase_V4');
        this.version(1).stores({
            registry: '++id, &name, type, category, installed',
            globals: '&name'
        });
    }
}

export const db = new HomelabDatabase();
