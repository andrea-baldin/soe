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

  it('supports fuzzy matching, scopes, kinds, and validation filters', () => {
    const root = {
      profile: { displayName: 'Ada Lovelace', score: 10 },
      status: 'active'
    };
    const issues = [
      {
        code: 'score',
        message: 'Review score',
        path: ['profile', 'score'],
        severity: 'warning' as const
      }
    ];

    expect(
      searchObject(root, {
        query: 'dspnm',
        mode: 'fuzzy',
        scope: 'path'
      }).map((result) => result.formattedPath)
    ).toEqual(['profile.displayName']);
    expect(
      searchObject(root, {
        query: '10',
        kinds: ['number'],
        scope: 'value',
        validation: 'warnings',
        validationIssues: issues
      }).map((result) => result.formattedPath)
    ).toEqual(['profile.score']);
    expect(
      searchObject(root, {
        query: 'active',
        kinds: ['number']
      })
    ).toEqual([]);
  });

  it('ranks exact and compact matches deterministically', () => {
    const results = searchObject(
      { exact: 'ada', later: 'prefix ada', fuzzy: 'a-d-a' },
      { query: 'ada', mode: 'fuzzy', scope: 'value' }
    );

    expect(results.map((result) => result.formattedPath)).toEqual([
      'exact',
      'later',
      'fuzzy'
    ]);
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });
});
