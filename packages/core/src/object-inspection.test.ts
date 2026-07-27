import { describe, expect, it } from 'vitest';

import {
  inspectionEntries,
  isInspectableContainer
} from './object-inspection.js';

describe('object inspection', () => {
  it('exposes map and set entries without changing their values', () => {
    expect(inspectionEntries(new Map([['name', 'Ada']]))).toEqual([
      { key: '[0] name', value: 'Ada' }
    ]);
    expect(inspectionEntries(new Set(['logic']))).toEqual([
      { key: 0, value: 'logic' }
    ]);
  });

  it('includes symbol keys and never invokes accessors', () => {
    const symbol = Symbol('secret');
    let reads = 0;
    const value = Object.defineProperties(
      { [symbol]: 42 },
      {
        computed: {
          enumerable: true,
          get() {
            reads += 1;
            return 'unsafe';
          }
        }
      }
    );

    expect(inspectionEntries(value)).toEqual([
      { key: 'computed', value: '[Getter]' },
      { key: 'Symbol(secret)', value: 42 }
    ]);
    expect(reads).toBe(0);
  });

  it('recognizes useful containers and rejects leaf built-ins', () => {
    expect(isInspectableContainer(new Map())).toBe(true);
    expect(isInspectableContainer(new Set())).toBe(true);
    expect(
      isInspectableContainer(
        new (class Example {
          value = 1;
        })()
      )
    ).toBe(true);
    expect(isInspectableContainer(new Date())).toBe(false);
  });
});
