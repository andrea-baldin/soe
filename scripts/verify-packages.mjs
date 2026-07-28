/**
 * Published packages are verified from tarballs in an isolated consumer app.
 */

import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = new URL('../', import.meta.url);
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'soe-packages-'));
const tarballDirectory = join(temporaryDirectory, 'tarballs');
const consumerDirectory = join(temporaryDirectory, 'consumer');

function run(command, arguments_, cwd = repositoryRoot) {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: join(temporaryDirectory, 'npm-cache')
    },
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${arguments_.join(' ')} failed`);
  }
}

function packageTarball(name) {
  const fragment = name.replace('@', '').replace('/', '-');
  const file = readdirSync(tarballDirectory).find(
    (candidate) =>
      candidate.startsWith(`${fragment}-`) && candidate.endsWith('.tgz')
  );

  if (!file) {
    throw new Error(`No tarball found for ${name}`);
  }

  return join(tarballDirectory, file);
}

try {
  run('pnpm', ['build']);
  run('mkdir', ['-p', tarballDirectory]);
  run('pnpm', [
    '--filter',
    '@andrea-baldin/soe-core',
    'pack',
    '--pack-destination',
    tarballDirectory
  ]);
  run('pnpm', [
    '--filter',
    '@andrea-baldin/soe-svelte',
    'pack',
    '--pack-destination',
    tarballDirectory
  ]);

  const coreTarball = packageTarball('@andrea-baldin/soe-core');
  const svelteTarball = packageTarball('@andrea-baldin/soe-svelte');

  run('mkdir', ['-p', join(consumerDirectory, 'src')]);
  writeFileSync(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'soe-package-consumer',
        private: true,
        type: 'module',
        scripts: {
          build: 'vite build'
        },
        dependencies: {
          '@andrea-baldin/soe-core': `file:${coreTarball}`,
          '@andrea-baldin/soe-svelte': `file:${svelteTarball}`,
          svelte: '5.56.8'
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': '7.2.0',
          vite: '8.0.0'
        }
      },
      null,
      2
    )}\n`
  );
  writeFileSync(
    join(consumerDirectory, 'index.html'),
    '<div id="app"></div><script type="module" src="/src/main.js"></script>\n'
  );
  writeFileSync(
    join(consumerDirectory, 'src', 'App.svelte'),
    `<script>
  import { ObjectEditor } from '@andrea-baldin/soe-svelte';

  let value = $state({ name: 'Ada', active: true });
</script>

<ObjectEditor bind:value />
`
  );
  writeFileSync(
    join(consumerDirectory, 'src', 'main.js'),
    `import { mount } from 'svelte';
import { formatObjectPath } from '@andrea-baldin/soe-core';
import App from './App.svelte';

if (formatObjectPath(['profile', 0]) !== 'profile[0]') {
  throw new Error('The core package export is not usable');
}

mount(App, { target: document.getElementById('app') });
`
  );
  writeFileSync(
    join(consumerDirectory, 'vite.config.js'),
    `import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [svelte()] });
`
  );

  run(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    consumerDirectory
  );
  run('npm', ['run', 'build'], consumerDirectory);

  const svelteManifest = JSON.parse(
    readFileSync(
      join(
        consumerDirectory,
        'node_modules',
        '@andrea-baldin',
        'soe-svelte',
        'package.json'
      ),
      'utf8'
    )
  );

  if (
    svelteManifest.dependencies?.['@andrea-baldin/soe-core'] !==
    svelteManifest.version
  ) {
    throw new Error(
      'The Svelte tarball does not pin the matching core version'
    );
  }

  console.log('SOE package tarballs passed isolated installation and build.');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
