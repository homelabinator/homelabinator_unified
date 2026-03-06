import * as esbuild from 'esbuild';
import { glob } from 'glob';
import { writeFile, cp } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { rm } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  await rm(join(__dirname, 'dist'), { recursive: true, force: true });

  const apps = await glob('templates/apps/*.nix.hbs', { cwd: __dirname });
  const services = await glob('templates/services/*', { cwd: __dirname });
  const volumes = await glob('templates/volumes/*', { cwd: __dirname });

  const manifest = {
    apps,
    services,
    volumes,
  };

  await writeFile(
    join(__dirname, 'src/config_generator/manifest.ts'),
    `export const manifest = ${JSON.stringify(manifest, null, 2)};`
  );

  await esbuild.build({
    entryPoints: [
        join(__dirname, 'src/config_generator/appstore.ts'),
    ],
    bundle: true,
    outdir: join(__dirname, 'dist'),
    format: 'esm',
    sourcemap: true,
    splitting: true,
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
