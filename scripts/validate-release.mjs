/**
 * A release tag is accepted only when packages and changelog agree.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const expectedCoreName = '@andreabaldin/soe-core';
const expectedSvelteName = '@andreabaldin/soe-svelte';

export function validateRelease({
  tag,
  coreManifest,
  svelteManifest,
  changelog
}) {
  const errors = [];
  const version = coreManifest.version;

  if (coreManifest.name !== expectedCoreName) {
    errors.push(`Core package must be named ${expectedCoreName}`);
  }

  if (svelteManifest.name !== expectedSvelteName) {
    errors.push(`Svelte package must be named ${expectedSvelteName}`);
  }

  if (!version || svelteManifest.version !== version) {
    errors.push('Core and Svelte package versions must match');
  }

  if (tag !== `v${version}`) {
    errors.push(`Release tag must be v${version}`);
  }

  if (svelteManifest.dependencies?.[expectedCoreName] !== 'workspace:*') {
    errors.push('Svelte must depend on the matching workspace core package');
  }

  const escapedVersion = version?.replaceAll('.', '\\.');
  const releaseHeading = new RegExp(
    `^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`,
    'm'
  );

  if (!version || !releaseHeading.test(changelog)) {
    errors.push(`Changelog must contain a dated ${version} release heading`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return version;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isMainModule() {
  return (
    process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
  );
}

if (isMainModule()) {
  const tag = process.argv[2];

  if (!tag) {
    throw new Error('Usage: pnpm release:check vX.Y.Z');
  }

  const version = validateRelease({
    tag,
    coreManifest: readJson('packages/core/package.json'),
    svelteManifest: readJson('packages/svelte/package.json'),
    changelog: readFileSync('CHANGELOG.md', 'utf8')
  });

  console.log(`Release contract verified for SOE ${version}.`);
}
