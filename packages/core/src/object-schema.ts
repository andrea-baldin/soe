/**
 * Object schemas add explicit knowledge without owning data or rendering.
 */

import type { ObjectPath } from './object-path.js';

export type SchemaValueType = 'boolean' | 'number' | 'string';

export interface FieldValidationContext {
  readonly path: ObjectPath;
  readonly root: unknown;
}

export type FieldValidator = (
  value: unknown,
  context: FieldValidationContext
) => string | undefined;

export interface FieldSchema {
  readonly type?: SchemaValueType;
  readonly fields?: Readonly<Record<string, FieldSchema>>;
  readonly items?: FieldSchema;
  readonly validate?: FieldValidator;
}

export interface ObjectSchema {
  readonly fields: Readonly<Record<string, FieldSchema>>;
}

export function fieldSchemaAtPath(
  schema: ObjectSchema | undefined,
  path: ObjectPath
): FieldSchema | undefined {
  let field: FieldSchema | undefined;

  for (const segment of path) {
    if (typeof segment === 'number') {
      field = field?.items;
    } else {
      field = field ? field.fields?.[segment] : schema?.fields[segment];
    }

    if (!field) return undefined;
  }

  return field;
}

export function validateField(
  value: unknown,
  schema: FieldSchema | undefined,
  context: FieldValidationContext
): string | undefined {
  if (!schema) return undefined;

  if (schema.type && !matchesType(value, schema.type)) {
    return `Expected ${schema.type}`;
  }

  if (!schema.validate) return undefined;

  try {
    const result = schema.validate(value, context);
    return typeof result === 'string' && result ? result : undefined;
  } catch {
    return 'Validation could not be completed';
  }
}

function matchesType(value: unknown, type: SchemaValueType): boolean {
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === type;
}
