import { describe, expect, it } from 'vitest';

import {
  applyObjectReplacements,
  planObjectReplacements
} from './object-replacement.js';
import { searchObject } from './object-search.js';

describe('object replacement', () => {
  it('previews and applies case-insensitive replacements immutably', () => {
    const root = {
      title: 'Ada and ADA',
      nested: { title: 'Ada' },
      untouched: 10
    };
    const replacements = planObjectReplacements(
      root,
      searchObject(root, { query: 'ada', scope: 'value' }),
      'ada',
      'Grace'
    );
    const updated = applyObjectReplacements(root, replacements);

    expect(replacements).toMatchObject([
      {
        formattedPath: 'nested.title',
        previousValue: 'Ada',
        nextValue: 'Grace'
      },
      {
        formattedPath: 'title',
        previousValue: 'Ada and ADA',
        nextValue: 'Grace and Grace'
      }
    ]);
    expect(updated).toEqual({
      title: 'Grace and Grace',
      nested: { title: 'Grace' },
      untouched: 10
    });
    expect(root.title).toBe('Ada and ADA');
    expect(Object.isFrozen(replacements)).toBe(true);
  });

  it('skips denied, duplicate, non-string, and unchanged results', () => {
    const root = { allowed: 'Ada', denied: 'Ada', count: 10 };
    const results = searchObject(root, 'ada');

    expect(
      planObjectReplacements(root, [...results, ...results], 'ada', 'Grace', {
        canReplace: (result) => result.formattedPath !== 'denied'
      }).map((replacement) => replacement.formattedPath)
    ).toEqual(['allowed']);
    expect(planObjectReplacements(root, results, '', 'Grace')).toEqual([]);
  });
});
