import { AppStore } from '../../dist/appstore.js';

const appStore = AppStore.getInstance();

async function testConfigGeneration() {
  try {
    await appStore.init();

    const calibreApp = await appStore.getApp('calibre');
    calibreApp.install();

    const tailscaleService = await appStore.getService('tailscale');
    calibreApp.addService(tailscaleService);

    const configVolume = await appStore.getVolume('config');
    calibreApp.addVolume(configVolume);

    const config = await appStore.generateConfig();
    console.log(config);
  } catch (e) {
    console.error(e);
  }
}

testConfigGeneration();
