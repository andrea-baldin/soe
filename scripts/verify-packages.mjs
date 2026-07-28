/**
 * Published packages are verified from tarballs in an isolated consumer app.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

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
    const reason = result.error?.message ?? `exit code ${result.status}`;
    throw new Error(`${command} ${arguments_.join(' ')} failed: ${reason}`);
  }
}

function runPnpm(arguments_, cwd = repositoryRoot) {
  const pnpmEntryPoint = process.env.npm_execpath;

  if (!pnpmEntryPoint) {
    throw new Error('Run package verification through pnpm package:check');
  }

  run(process.execPath, [pnpmEntryPoint, ...arguments_], cwd);
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
  runPnpm(['build']);
  mkdirSync(tarballDirectory, { recursive: true });
  runPnpm([
    '--filter',
    '@andreabaldin/soe-core',
    'pack',
    '--pack-destination',
    tarballDirectory
  ]);
  runPnpm([
    '--filter',
    '@andreabaldin/soe-svelte',
    'pack',
    '--pack-destination',
    tarballDirectory
  ]);

  const coreTarball = packageTarball('@andreabaldin/soe-core');
  const svelteTarball = packageTarball('@andreabaldin/soe-svelte');

  mkdirSync(join(consumerDirectory, 'src'), { recursive: true });
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
          '@andreabaldin/soe-core': pathToFileURL(coreTarball).href,
          '@andreabaldin/soe-svelte': pathToFileURL(svelteTarball).href,
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
    join(consumerDirectory, 'pnpm-workspace.yaml'),
    `overrides:
  '@andreabaldin/soe-core': '${pathToFileURL(coreTarball).href}'
`
  );
  writeFileSync(
    join(consumerDirectory, 'index.html'),
    '<div id="app"></div><script type="module" src="/src/main.js"></script>\n'
  );
  writeFileSync(
    join(consumerDirectory, 'src', 'App.svelte'),
    `<script>
  import { ObjectEditor } from '@andreabaldin/soe-svelte';

  let value = $state({ name: 'Ada', active: true });
</script>

<ObjectEditor bind:value />
`
  );
  writeFileSync(
    join(consumerDirectory, 'src', 'main.js'),
    `import { mount } from 'svelte';
import { formatObjectPath } from '@andreabaldin/soe-core';
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

  runPnpm(['install', '--ignore-scripts'], consumerDirectory);
  runPnpm(['run', 'build'], consumerDirectory);

  const svelteManifest = JSON.parse(
    readFileSync(
      join(
        consumerDirectory,
        'node_modules',
        '@andreabaldin',
        'soe-svelte',
        'package.json'
      ),
      'utf8'
    )
  );

  if (
    svelteManifest.dependencies?.['@andreabaldin/soe-core'] !==
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
