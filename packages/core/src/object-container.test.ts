import { describe, expect, it } from 'vitest';

import {
  isEditableContainer,
  objectEntries,
  parseObjectContainer
} from './object-container.js';

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

describe('parseObjectContainer', () => {
  it('parses objects and arrays only into matching container kinds', () => {
    expect(parseObjectContainer('{"name":"Grace"}', {})).toEqual({
      name: 'Grace'
    });
    expect(parseObjectContainer('["logic"]', [])).toEqual(['logic']);
    expect(parseObjectContainer('["logic"]', {})).toBeUndefined();
    expect(parseObjectContainer('{"name":"Grace"}', [])).toBeUndefined();
  });

  it('rejects primitives and invalid JSON without throwing', () => {
    expect(parseObjectContainer('"Ada"', {})).toBeUndefined();
    expect(parseObjectContainer('null', {})).toBeUndefined();
    expect(parseObjectContainer('{', {})).toBeUndefined();
  });
});
