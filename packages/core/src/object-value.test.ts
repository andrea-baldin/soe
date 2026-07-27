import { describe, expect, it } from 'vitest';

import {
  formatObjectValue,
  isEditableValue,
  objectValueKind,
  serializeObjectValue
} from './object-value.js';

describe('objectValueKind', () => {
  it.each([
    [null, 'null'],
    ['hello', 'string'],
    [10, 'number'],
    [true, 'boolean'],
    [123n, 'bigint'],
    [/abc/, 'regexp'],
    [new Map(), 'map'],
    [new Set(), 'set'],
    [new URL('https://example.com'), 'url']
  ])('classifies %s as %s', (value, expected) => {
    expect(objectValueKind(value)).toBe(expected);
  });
});

describe('isEditableValue', () => {
  it('accepts primitive values supported by the first editor', () => {
    expect(isEditableValue('hello')).toBe(true);
    expect(isEditableValue(10)).toBe(true);
    expect(isEditableValue(false)).toBe(true);
    expect(isEditableValue(null)).toBe(true);
  });

  it('rejects values that are inspection-only', () => {
    expect(isEditableValue({})).toBe(false);
    expect(isEditableValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isEditableValue(Number.NaN)).toBe(false);
    expect(isEditableValue(Symbol('value'))).toBe(false);
  });
});

describe('formatObjectValue', () => {
  it('formats inspection-only values without throwing', () => {
    expect(formatObjectValue(new Date('2025-02-14'))).toBe('2025-02-14');
    expect(formatObjectValue(new Map([[1, 'one']]))).toBe('Map(1)');
    expect(formatObjectValue(new Set([1, 2]))).toBe('Set(2)');
    expect(formatObjectValue(123n)).toBe('123n');
    expect(formatObjectValue(() => undefined)).toBe('function()');
  });

  it('survives objects with a throwing constructor accessor', () => {
    const value = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(value, 'constructor', {
      get() {
        throw new Error('unavailable');
      }
    });

    expect(formatObjectValue(value)).toBe('Unknown value');
  });
});

describe('serializeObjectValue', () => {
  it('copies primitive and special values as readable text', () => {
    expect(serializeObjectValue('Ada')).toBe('Ada');
    expect(serializeObjectValue(10n)).toBe('10n');
    expect(serializeObjectValue(new Map([['name', 'Ada']]))).toBe('Map(1)');
  });

  it('copies editable containers as formatted JSON', () => {
    expect(serializeObjectValue({ active: true, name: 'Ada' })).toBe(
      '{\n  "active": true,\n  "name": "Ada"\n}'
    );
  });

  it('falls back safely for circular containers', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => serializeObjectValue(circular)).not.toThrow();
    expect(serializeObjectValue(circular)).toBe('Object');
  });
});
