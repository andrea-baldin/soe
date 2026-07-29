import { describe, expect, it } from 'vitest';

import {
  schemaFieldSuggestions,
  schemaInitialValue
} from './schema-authoring.js';

describe('schema authoring', () => {
  it('prefers defaults, enum values, types, and container knowledge', () => {
    expect(schemaInitialValue({ defaultValue: { enabled: true } })).toEqual({
      enabled: true
    });
    expect(schemaInitialValue({ enum: ['draft', 'published'] })).toBe('draft');
    expect(schemaInitialValue({ type: 'string' })).toBe('');
    expect(schemaInitialValue({ type: 'number' })).toBe(0);
    expect(schemaInitialValue({ type: 'boolean' })).toBe(false);
    expect(schemaInitialValue({ items: { type: 'string' } })).toEqual([]);
  });

  it('builds nested objects from required field knowledge', () => {
    expect(
      schemaInitialValue({
        fields: {
          name: { required: true, defaultValue: 'Ada' },
          active: { required: true, type: 'boolean' },
          optional: { type: 'string' }
        }
      })
    ).toEqual({ name: 'Ada', active: false });
  });

  it('suggests only absent known fields and returns fresh default values', () => {
    const fields = {
      profile: {
        required: true,
        defaultValue: { name: 'Ada' }
      },
      status: { enum: ['draft', 'published'] as const }
    };
    const first = schemaFieldSuggestions({}, fields);
    const second = schemaFieldSuggestions({}, fields);

    expect(first).toMatchObject([
      { key: 'profile', required: true, value: { name: 'Ada' } },
      { key: 'status', required: false, value: 'draft' }
    ]);
    expect(first[0]?.value).not.toBe(second[0]?.value);
    expect(schemaFieldSuggestions({ profile: {} }, fields)).toMatchObject([
      { key: 'status' }
    ]);
  });
});
