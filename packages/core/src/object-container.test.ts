import { describe, expect, it } from 'vitest';

import { isEditableContainer, objectEntries } from './object-container.js';

describe('isEditableContainer', () => {
  it('accepts arrays and plain objects', () => {
    expect(isEditableContainer([])).toBe(true);
    expect(isEditableContainer({})).toBe(true);
    expect(isEditableContainer(Object.create(null))).toBe(true);
  });

  it('rejects class instances and built-in collections', () => {
    expect(isEditableContainer(new Date())).toBe(false);
    expect(isEditableContainer(new Map())).toBe(false);
    expect(isEditableContainer(new (class Example {})())).toBe(false);
  });
});

describe('objectEntries', () => {
  it('uses numeric keys for array entries', () => {
    expect(objectEntries(['first', 'second'])).toEqual([
      { key: 0, value: 'first' },
      { key: 1, value: 'second' }
    ]);
  });

  it('does not throw when a property cannot be read', () => {
    const value = {
      get unavailable(): never {
        throw new Error('unavailable');
      }
    };

    expect(objectEntries(value)).toEqual([
      { key: 'unavailable', value: undefined }
    ]);
  });
});
