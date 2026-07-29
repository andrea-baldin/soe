/**
 * Schema authoring derives safe initial values without owning mutations.
 */

import type { FieldSchema } from './object-schema.js';

export interface SchemaFieldSuggestion {
  readonly key: string;
  readonly required: boolean;
  readonly value: unknown;
}

export function schemaInitialValue(schema: FieldSchema | undefined): unknown {
  if (!schema) return null;
  if (Object.hasOwn(schema, 'defaultValue')) {
    return cloneInitialValue(schema.defaultValue);
  }
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === 'string') return '';
  if (schema.type === 'number') return 0;
  if (schema.type === 'boolean') return false;
  if (schema.fields) {
    return Object.fromEntries(
      schemaFieldSuggestions({}, schema.fields)
        .filter((field) => field.required)
        .map((field) => [field.key, field.value])
    );
  }
  if (schema.items || schema.prefixItems) return [];
  return null;
}

export function schemaFieldSuggestions(
  value: unknown,
  fields: Readonly<Record<string, FieldSchema>> | undefined
): readonly SchemaFieldSuggestion[] {
  if (!fields || typeof value !== 'object' || value === null) return [];
  return Object.freeze(
    Object.entries(fields).flatMap(([key, schema]) =>
      Object.hasOwn(value, key)
        ? []
        : [
            Object.freeze({
              key,
              required: schema.required === true,
              value: schemaInitialValue(schema)
            })
          ]
    )
  );
}

function cloneInitialValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneInitialValue);
  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        cloneInitialValue(entry)
      ])
    );
  }
  return value;
}
