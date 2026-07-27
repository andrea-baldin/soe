import { describe, expect, it } from 'vitest';

import { resolveNodeContext } from './node-context.js';
import { createPropertyResolver } from './property-provider.js';

interface TestProperties {
  label: string;
  emphasis: boolean;
  description?: string;
}

const context = resolveNodeContext({
  root: { name: 'Ada' },
  value: 'Ada',
  parent: { name: 'Ada' },
  path: ['name']
});

describe('createPropertyResolver', () => {
  it('applies typed contributions in registration order', () => {
    const resolver = createPropertyResolver<TestProperties>(
      { label: 'name', emphasis: false },
      [
        {
          provide(receivedContext, current) {
            expect(receivedContext).toBe(context);
            expect(Object.isFrozen(current)).toBe(true);
            return { label: 'Display name', emphasis: true };
          }
        },
        {
          provide(_context, current) {
            expect(current.label).toBe('Display name');
            return { label: 'Preferred name' };
          }
        }
      ]
    );

    expect(resolver.resolve(context)).toEqual({
      label: 'Preferred name',
      emphasis: true
    });
  });

  it('isolates provider failures and ignores absent contributions', () => {
    const resolver = createPropertyResolver<TestProperties>(
      { label: 'name', emphasis: false },
      [
        {
          provide() {
            throw new Error('Failure');
          }
        },
        {
          provide: () => undefined
        },
        {
          provide: () => ({ description: 'Safe' })
        }
      ]
    );

    expect(resolver.resolve(context)).toEqual({
      label: 'name',
      emphasis: false,
      description: 'Safe'
    });
  });

  it('returns a fresh frozen result for every resolution', () => {
    let calls = 0;
    const resolver = createPropertyResolver<TestProperties>(
      { label: 'name', emphasis: false },
      [
        {
          provide() {
            calls += 1;
            return { label: `name-${calls}` };
          }
        }
      ]
    );

    const first = resolver.resolve(context);
    const second = resolver.resolve(context);

    expect(first).not.toBe(second);
    expect(first.label).toBe('name-1');
    expect(second.label).toBe('name-2');
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
  });

  it('copies defaults and provider registration', () => {
    const defaults: TestProperties = { label: 'name', emphasis: false };
    const providers = [{ provide: () => ({ emphasis: true }) }];
    const resolver = createPropertyResolver(defaults, providers);

    defaults.label = 'changed';
    providers.length = 0;

    expect(resolver.resolve(context)).toEqual({
      label: 'name',
      emphasis: true
    });
  });
});
