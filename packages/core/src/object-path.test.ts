import { describe, expect, it } from 'vitest';

import { formatObjectPath, replaceValueAtPath } from './object-path.js';

describe('formatObjectPath', () => {
  it('formats properties, array indices, and unusual keys', () => {
    expect(formatObjectPath(['person', 'skills', 0, 'display name'])).toBe(
      'person.skills[0]["display name"]'
    );
  });
});

describe('replaceValueAtPath', () => {
  it('replaces a nested value with structural sharing', () => {
    const address = { city: 'London' };
    const source = {
      person: {
        address,
        name: 'Ada',
        skills: ['math', 'logic']
      },
      stable: { value: true }
    };

    const result = replaceValueAtPath(
      source,
      ['person', 'skills', 1],
      'computing'
    );

    expect(result).toEqual({
      person: {
        address,
        name: 'Ada',
        skills: ['math', 'computing']
      },
      stable: { value: true }
    });
    expect(result).not.toBe(source);
    expect(result.person).not.toBe(source.person);
    expect(result.person.skills).not.toBe(source.person.skills);
    expect(result.person.address).toBe(address);
    expect(result.stable).toBe(source.stable);
  });

  it('returns the original root when the path is invalid', () => {
    const source = { person: { name: 'Ada' } };

    expect(replaceValueAtPath(source, ['person', 'missing'], 'Grace')).toBe(
      source
    );
    expect(replaceValueAtPath(source, ['person', 0], 'Grace')).toBe(source);
  });

  it('can replace the root value', () => {
    expect(replaceValueAtPath({ name: 'Ada' }, [], { name: 'Grace' })).toEqual({
      name: 'Grace'
    });
  });

  it('leaves hostile containers unchanged instead of throwing', () => {
    const source = new Proxy(
      { name: 'Ada' },
      {
        getOwnPropertyDescriptor() {
          throw new Error('unavailable');
        }
      }
    );

    expect(replaceValueAtPath(source, ['name'], 'Grace')).toBe(source);
  });
});
