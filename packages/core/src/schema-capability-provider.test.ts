import { describe, expect, it } from 'vitest';

import { createCapabilityResolver } from './capability-resolver.js';
import { schemaCapabilityProvider } from './schema-capability-provider.js';

const resolver = createCapabilityResolver([schemaCapabilityProvider]);

describe('schemaCapabilityProvider', () => {
  it('makes readonly nodes operationally immutable', () => {
    const root = { profile: { name: 'Ada' } };

    expect(
      resolver.resolve({
        root,
        value: root.profile,
        parent: root,
        path: ['profile'],
        schema: { readonly: true }
      })
    ).toMatchObject({
      delete: false,
      editValue: false,
      insert: false,
      move: false,
      paste: false,
      renameKey: false
    });
  });

  it('keeps known-field insertion available while applying key policies', () => {
    const root = { profile: { name: 'Ada' } };

    expect(
      resolver.resolve({
        root,
        value: root.profile,
        parent: root,
        path: ['profile'],
        schema: {
          additionalProperties: false,
          removable: false,
          renameable: false
        }
      })
    ).toMatchObject({
      delete: false,
      insert: true,
      renameKey: false
    });
  });

  it('enforces minimum and maximum array sizes', () => {
    const values = ['first'];

    expect(
      resolver.resolve({
        root: { values },
        value: values,
        parent: { values },
        path: ['values'],
        schema: { maximumItems: 1 }
      }).insert
    ).toBe(false);

    expect(
      resolver.resolve({
        root: { values },
        value: values[0],
        parent: values,
        parentSchema: { minimumItems: 1 },
        path: ['values', 0]
      }).delete
    ).toBe(false);
  });
});
