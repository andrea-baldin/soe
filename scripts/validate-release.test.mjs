/**
 * Release validation prevents partial or mislabeled publications.
 */

import { describe, expect, it } from 'vitest';
import { validateRelease } from './validate-release.mjs';

function release(overrides = {}) {
  return {
    tag: 'v1.2.3',
    coreManifest: {
      name: '@andreabaldin/soe-core',
      version: '1.2.3'
    },
    svelteManifest: {
      name: '@andreabaldin/soe-svelte',
      version: '1.2.3',
      dependencies: {
        '@andreabaldin/soe-core': 'workspace:*'
      }
    },
    changelog: '## [1.2.3] - 2026-07-28\n',
    ...overrides
  };
}

describe('validateRelease', () => {
  it('accepts matching package, tag, dependency, and changelog versions', () => {
    expect(validateRelease(release())).toBe('1.2.3');
  });

  it('rejects a tag that does not match the package version', () => {
    expect(() => validateRelease(release({ tag: 'v1.2.4' }))).toThrow(
      'Release tag must be v1.2.3'
    );
  });

  it('rejects mismatched package versions', () => {
    const candidate = release();
    candidate.svelteManifest.version = '1.2.4';

    expect(() => validateRelease(candidate)).toThrow(
      'Core and Svelte package versions must match'
    );
  });

  it('rejects a package outside the owned npm scope', () => {
    const candidate = release();
    candidate.coreManifest.name = '@example/soe-core';

    expect(() => validateRelease(candidate)).toThrow(
      'Core package must be named @andreabaldin/soe-core'
    );
  });

  it('rejects a Svelte package without the workspace core dependency', () => {
    const candidate = release();
    candidate.svelteManifest.dependencies['@andreabaldin/soe-core'] = '^1.2.3';

    expect(() => validateRelease(candidate)).toThrow(
      'Svelte must depend on the matching workspace core package'
    );
  });

  it('rejects an unreleased changelog version', () => {
    expect(() =>
      validateRelease(release({ changelog: '## [Unreleased]\n' }))
    ).toThrow('Changelog must contain a dated 1.2.3 release heading');
  });
});
