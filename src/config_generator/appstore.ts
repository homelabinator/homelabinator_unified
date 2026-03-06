import Dexie, { Table } from 'dexie';
import Handlebars from 'handlebars';

import { manifest } from './manifest';

export class App {
  id?: number;
  name: string;
  handlebars_config: string;
  installed: number; // 0 for false, 1 for true
  services: Service[];
  volumes: Volume[];
  fields: { [key: string]: any };

    constructor(
    name: string,
    handlebars_config: string,
    installed: number,
    services: Service[],
    volumes: Volume[],
    fields: { [key: string]: any },
    id?: number
  ) {
    this.name = name;
    this.handlebars_config = handlebars_config;
    this.installed = installed;
    this.services = services;
    this.volumes = volumes;
    this.fields = fields;
    if (id) this.id = id;
    }
}

export class Service {
  id?: number;
  name: string;
  core_config: string; // for global configurations like Tailscale operator
  template_config: string; // for per-app configurations like Ingress
  fields: { [key: string]: any };

    constructor(
    name: string,
    core_config: string,
    template_config: string,
    fields: { [key: string]: any },
    id?: number
    ) {
        this.name = name;
        this.core_config = core_config;
        this.template_config = template_config;
        this.fields = fields;
        if (id) this.id = id;
    }
}

export class Volume {
  id?: number;
  name: string;
  core_config: string; // empty for now
  template_config: string; // for per-app volume mounts
  fields: { [key: string]: any };

    constructor(
    name: string,
    core_config: string,
    template_config: string,
    fields: { [key: string]: any },
    id?: number
    ) {
        this.name = name;
        this.core_config = core_config;
        this.template_config = template_config;
        this.fields = fields;
        if (id) this.id = id;
    }
}

export class HomelabDb extends Dexie {
  apps!: Table<App>;
  services!: Table<Service>;
  volumes!: Table<Volume>;

  constructor() {
    super('HomelabDb_v2');
    this.version(1).stores({
      apps: '++id, &name, installed',
      services: '++id, &name',
      volumes: '++id, &name',
    });
    this.apps.mapToClass(App);
    this.services.mapToClass(Service);
    this.volumes.mapToClass(Volume);
  }
}

export const db = new HomelabDb();

export class AppStore {
  private static instance: AppStore;

  private constructor() {}

  public static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore();
    }
    return AppStore.instance;
  }

  private isInitializing = false;

  async init() {
    await db.delete();
    await db.open();

    if (this.isInitializing) {
      console.log("Initialization already in progress.");
      return;
    }
    this.isInitializing = true;

    try {
      const appCount = await db.apps.count();
      if (appCount === 0) {
        console.log('Database apps is empty. Populating...');
        for (const appPath of manifest.apps) {
          const appName = appPath.split('/').pop()?.replace('.nix.hbs', '') || 'unknown';
          const config = await (await fetch(`/${appPath}`)).text();
          await this.addApp(appName, config);
        }
      }

      const serviceCount = await db.services.count();
      if (serviceCount === 0) {
        console.log('Database services is empty. Populating...');
        for (const serviceDirPath of manifest.services) {
          const serviceName = serviceDirPath.split('/').pop() || 'unknown';
          const coreConfig = await (await fetch(`/${serviceDirPath}/core.nix.hbs`)).text();
          const templateConfig = await (await fetch(`/${serviceDirPath}/template.nix.hbs`)).text();
          await this.addService(serviceName, coreConfig, templateConfig);
        }
      }

      const volumeCount = await db.volumes.count();
      if (volumeCount === 0) {
        console.log('Database volumes is empty. Populating...');
        for (const volumeDirPath of manifest.volumes) {
          const volumeName = volumeDirPath.split('/').pop() || 'unknown';
          const coreConfig = await (await fetch(`/${volumeDirPath}/core.nix.hbs`)).text();
          const templateConfig = await (await fetch(`/${volumeDirPath}/template.nix.hbs`)).text();
          await this.addVolume(volumeName, coreConfig, templateConfig);
        }
      }
    } finally {
      this.isInitializing = false;
    }
  }

  async addApp(name: string, handlebars_config: string) {
    const app = new App(
      name,
      handlebars_config,
      0,
      [],
      [],
      {},
    );
    await db.apps.add(app);
  }

  async addService(name: string, core_config: string, template_config: string) {
    const service = new Service(
      name,
      core_config,
      template_config,
      {},
    );
    await db.services.add(service);
  }

  async addVolume(name: string, core_config: string, template_config: string) {
    const volume = new Volume(
      name,
      core_config,
      template_config,
      {},
    );
    await db.volumes.add(volume);
  }

  async removeApp(name: string) {
    const app = await db.apps.get({ name });
    if (app && app.id) {
      await db.apps.delete(app.id);
    }
  }

  async removeService(name: string) {
    const service = await db.services.get({ name });
    if (service && service.id) {
      await db.services.delete(service.id);
    }
  }

  async removeVolume(name: string) {
    const volume = await db.volumes.get({ name });
    if (volume && volume.id) {
      await db.volumes.delete(volume.id);
    }
  }

  // Set installed status for an app
  async setAppInstalled(appName: string, installed: boolean) {
    const app = await db.apps.get({ name: appName });
    if (app) {
      app.installed = installed ? 1 : 0;
      await db.apps.put(app);
    }
  }

  // Add a service to an app
  async addServiceToApp(appName: string, serviceName: string) {
    const app = await db.apps.get({ name: appName });
    const service = await db.services.get({ name: serviceName });
    if (app && service) {
      app.services.push(service);
      await db.apps.put(app);
    }
  }

  // Remove a service from an app
  async removeServiceFromApp(appName: string, serviceName: string) {
    const app = await db.apps.get({ name: appName });
    if (app) {
      app.services = app.services.filter(s => s.name !== serviceName);
      await db.apps.put(app);
    }
  }

  // Add a volume to an app
  async addVolumeToApp(appName: string, volumeName: string) {
    const app = await db.apps.get({ name: appName });
    const volume = await db.volumes.get({ name: volumeName });
    if (app && volume) {
      app.volumes.push(volume);
      await db.apps.put(app);
    }
  }

  // Remove a volume from an app
  async removeVolumeFromApp(appName: string, volumeName: string) {
    const app = await db.apps.get({ name: appName });
    if (app) {
      app.volumes = app.volumes.filter(v => v.name !== volumeName);
      await db.apps.put(app);
    }
  }

  // Set fields for a service
  async setServiceFields(serviceName: string, fields: { [key: string]: any }) {
    const service = await db.services.get({ name: serviceName });
    if (service) {
      service.fields = { ...service.fields, ...fields };
      await db.services.put(service);
    }
  }

  // Set fields for a volume
  async setVolumeFields(volumeName: string, fields: { [key: string]: any }) {
    const volume = await db.volumes.get({ name: volumeName });
    if (volume) {
      volume.fields = { ...volume.fields, ...fields };
      await db.volumes.put(volume);
    }
  }

  async getApp(name: string): Promise<App | undefined> {
    return await db.apps.get({ name });
  }

  async getService(name: string): Promise<Service | undefined> {
    return await db.services.get({ name });
  }

  async getVolume(name: string): Promise<Volume | undefined> {
    return await db.volumes.get({ name });
  }

  async generateConfig(): Promise<string> {
    const installedApps = await db.apps.where('installed').equals(1).toArray();
    const coreTemplate = await (await fetch('/templates/core/config.nix.hbs')).text();

    let appsConfig = '';
    let globalServicesConfig = '';

    for (const app of installedApps) {
      let servicesConfig = '';
      if (app.services) {
        for (const service of app.services) {
          const serviceTemplate = Handlebars.compile(service.template_config);
          // Assuming a default port for now, can be made configurable
          servicesConfig += serviceTemplate({ app: { name: app.name, port: 8080 }, fields: service.fields });
        }
      }

      let volumesConfig = '';
      if (app.volumes) {
        for (const volume of app.volumes) {
          const volumeTemplate = Handlebars.compile(volume.template_config);
          volumesConfig += volumeTemplate({ app: { name: app.name }, fields: volume.fields });
        }
      }

      const appTemplate = Handlebars.compile(app.handlebars_config);
      appsConfig += appTemplate({ app, services: servicesConfig, volumes: volumesConfig });
    }

    const allServices = await db.services.toArray();
    for (const service of allServices) {
        if (service.core_config && service.core_config.trim() !== '') {
            const serviceTemplate = Handlebars.compile(service.core_config);
            globalServicesConfig += serviceTemplate({ fields: service.fields });
        }
    }

    const finalTemplate = Handlebars.compile(coreTemplate);
    return finalTemplate({ apps: appsConfig, globalservices: globalServicesConfig });
  }
}
