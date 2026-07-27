import { describe, expect, it } from 'vitest';

import { resolveNodeContext } from './node-context.js';

describe('resolveNodeContext', () => {
  it('resolves capabilities into one stable node context', () => {
    const root = { name: 'Ada' };
    const context = resolveNodeContext({
      root,
      value: root.name,
      parent: root,
      path: ['name'],
      schema: { type: 'string' }
    });

    expect(context).toMatchObject({
      root,
      value: 'Ada',
      parent: root,
      path: ['name'],
      schema: { type: 'string' },
      capabilities: {
        editValue: true,
        renameKey: true
      }
    });
  });

  it('freezes the context, path, and resolved capabilities', () => {
    const path = ['name'];
    const context = resolveNodeContext({
      root: { name: 'Ada' },
      value: 'Ada',
      parent: { name: 'Ada' },
      path
    });

    path.push('changed');

    expect(context.path).toEqual(['name']);
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.path)).toBe(true);
    expect(Object.isFrozen(context.capabilities)).toBe(true);
  });

  it('uses an explicitly composed resolver', () => {
    const context = resolveNodeContext(
      {
        root: { name: 'Ada' },
        value: 'Ada',
        parent: { name: 'Ada' },
        path: ['name']
      },
      {
        resolve: () => ({
          editValue: false,
          renameKey: false,
          delete: false,
          insert: false,
          move: false,
          copy: true,
          paste: false,
          inspect: true
        })
      }
    );

    expect(context.capabilities.editValue).toBe(false);
    expect(context.capabilities.inspect).toBe(true);
  });
});
