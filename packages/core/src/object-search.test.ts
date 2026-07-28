import { describe, expect, it } from 'vitest';

import { searchObject } from './object-search.js';

describe('searchObject', () => {
  it('matches canonical paths and formatted values recursively', () => {
    const root = {
      profile: { name: 'Ada Lovelace' },
      skills: ['mathematics']
    };

    expect(
      searchObject(root, 'ada').map((result) => result.formattedPath)
    ).toEqual(['profile.name']);
    expect(
      searchObject(root, 'skills').map((result) => result.formattedPath)
    ).toEqual(['skills', 'skills[0]']);
  });

  it('searches maps, sets, instances, and symbol keys', () => {
    const symbol = Symbol('secret');
    const instance = new (class Example {
      [symbol] = 'hidden value';
    })();
    const root = {
      instance,
      map: new Map([['engine', 'Analytical Engine']]),
      set: new Set(['logic'])
    };

    expect(searchObject(root, 'analytical')[0]?.formattedPath).toContain('map');
    expect(searchObject(root, 'logic')[0]?.formattedPath).toContain('set');
    expect(searchObject(root, 'secret')[0]?.formattedPath).toContain(
      'Symbol(secret)'
    );
  });

  it('does not invoke getters and stops circular traversal', () => {
    let reads = 0;
    const root: Record<string, unknown> = {
      get unsafe() {
        reads += 1;
        return 'side effect';
      }
    };
    root.self = root;

    expect(() => searchObject(root, 'getter')).not.toThrow();
    expect(reads).toBe(0);
  });

  it('normalizes empty queries and enforces the result limit', () => {
    expect(searchObject({ a: 1 }, '   ')).toEqual([]);
    expect(searchObject({ a: 'match', b: 'match' }, 'match', 1)).toHaveLength(
      1
    );
  });
});
