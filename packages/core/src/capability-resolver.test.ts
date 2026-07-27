import { describe, expect, it } from 'vitest';

import { resolveCapabilities } from './capability-resolver.js';

describe('resolveCapabilities', () => {
  it('derives value and object operations from node context', () => {
    const root = { name: 'Ada', profile: {} };

    expect(
      resolveCapabilities({
        root,
        value: root.name,
        parent: root,
        path: ['name']
      })
    ).toMatchObject({
      delete: true,
      editValue: true,
      insert: false,
      move: false,
      renameKey: true
    });
    expect(
      resolveCapabilities({
        root,
        value: root.profile,
        parent: root,
        path: ['profile']
      }).insert
    ).toBe(true);
  });

  it('derives movement from an array parent', () => {
    const root = { values: ['first'] };

    expect(
      resolveCapabilities({
        root,
        value: root.values[0],
        parent: root.values,
        path: ['values', 0]
      })
    ).toMatchObject({
      move: true,
      renameKey: false
    });
  });

  it('lets explicit schema knowledge enable value editing', () => {
    const root = { age: null };

    expect(
      resolveCapabilities({
        root,
        value: null,
        parent: root,
        path: ['age'],
        schema: { type: 'number' }
      }).editValue
    ).toBe(true);
  });

  it('falls back to safe capabilities when a resolver fails', () => {
    const capabilities = resolveCapabilities(
      { root: {}, value: {}, parent: undefined, path: [] },
      {
        resolve() {
          throw new Error('Failure');
        }
      }
    );

    expect(capabilities).toEqual({
      editValue: false,
      renameKey: false,
      delete: false,
      insert: false,
      move: false,
      copy: true,
      paste: false,
      inspect: true
    });
  });

  it('falls back safely when a resolver returns an invalid contract', () => {
    const capabilities = resolveCapabilities(
      { root: {}, value: {}, parent: undefined, path: [] },
      {
        resolve: () => undefined
      } as never
    );

    expect(capabilities.editValue).toBe(false);
    expect(capabilities.inspect).toBe(true);
  });
});
