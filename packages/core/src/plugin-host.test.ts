import { describe, expect, it } from 'vitest';

import type { CapabilityResolver } from './capability-resolver.js';
import { createPluginHost, type ObjectPlugin } from './plugin-host.js';

interface TestProperties {
  label: string;
  readonly: boolean;
}

const context = {
  root: { name: 'Ada' },
  value: 'Ada',
  parent: { name: 'Ada' },
  path: ['name'] as const
};

describe('createPluginHost', () => {
  it('resolves capabilities before properties in plugin order', () => {
    const events: string[] = [];
    const host = createPluginHost<TestProperties>({
      properties: { label: 'name', readonly: false },
      plugins: [
        {
          capabilities: {
            provide() {
              events.push('first capability');
              return { editValue: false };
            }
          },
          properties: {
            provide(resolvedContext) {
              events.push('first property');
              return {
                label: 'Display name',
                readonly: !resolvedContext.capabilities.editValue
              };
            }
          }
        },
        {
          capabilities: {
            provide(_context, current) {
              events.push('second capability');
              expect(current.editValue).toBe(false);
              return { inspect: false };
            }
          },
          properties: {
            provide(_context, current) {
              events.push('second property');
              expect(current.label).toBe('Display name');
              return { label: 'Preferred name' };
            }
          }
        }
      ]
    });

    const resolution = host.resolve(context);

    expect(events).toEqual([
      'first capability',
      'second capability',
      'first property',
      'second property'
    ]);
    expect(resolution.context.capabilities.editValue).toBe(false);
    expect(resolution.context.capabilities.inspect).toBe(false);
    expect(resolution.properties).toEqual({
      label: 'Preferred name',
      readonly: true
    });
  });

  it('accepts plugins contributing to only one extension point', () => {
    const host = createPluginHost<TestProperties>({
      properties: { label: 'name', readonly: false },
      plugins: [
        {
          capabilities: {
            provide: () => ({ copy: false })
          }
        },
        {
          properties: {
            provide: () => ({ label: 'Name' })
          }
        }
      ]
    });

    const resolution = host.resolve(context);

    expect(resolution.context.capabilities.copy).toBe(false);
    expect(resolution.properties.label).toBe('Name');
  });

  it('isolates failures through the existing provider contracts', () => {
    const host = createPluginHost<TestProperties>({
      properties: { label: 'name', readonly: false },
      plugins: [
        {
          capabilities: {
            provide() {
              throw new Error('Capability failure');
            }
          },
          properties: {
            provide() {
              throw new Error('Property failure');
            }
          }
        },
        {
          capabilities: {
            provide: () => ({ paste: false })
          },
          properties: {
            provide: () => ({ readonly: true })
          }
        }
      ]
    });

    const resolution = host.resolve(context);

    expect(resolution.context.capabilities.paste).toBe(false);
    expect(resolution.properties).toEqual({
      label: 'name',
      readonly: true
    });
  });

  it('copies plugin registration and returns frozen resolutions', () => {
    const plugins: ObjectPlugin<TestProperties>[] = [
      {
        properties: {
          provide: () => ({ label: 'Stable' })
        }
      }
    ];
    const capabilityResolver: CapabilityResolver = {
      resolve: () => ({
        editValue: true,
        renameKey: true,
        delete: true,
        insert: true,
        move: true,
        copy: true,
        paste: true,
        inspect: true
      })
    };
    const host = createPluginHost({
      properties: { label: 'name', readonly: false },
      plugins,
      capabilityResolver
    });

    plugins.length = 0;
    const resolution = host.resolve(context);

    expect(resolution.properties.label).toBe('Stable');
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.context)).toBe(true);
    expect(Object.isFrozen(resolution.properties)).toBe(true);
  });
});
