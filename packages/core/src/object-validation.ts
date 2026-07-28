/**
 * Object validation collects resolved schema issues without rendering.
 */

import {
  resolveFieldSchema,
  validateField,
  type FieldSchema,
  type ObjectSchema
} from './object-schema.js';
import { formatObjectPath, type ObjectPath } from './object-path.js';

export type ValidationIssueCode = 'invalid' | 'required';

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ObjectPath;
  readonly formattedPath: string;
  readonly severity: 'error' | 'warning';
}

export function validateObject(
  root: unknown,
  schema: ObjectSchema | undefined
): readonly ValidationIssue[] {
  if (!schema) return [];

  const issues: ValidationIssue[] = [];
  validateValue(root, [], root, schema, undefined, [], issues);
  return issues;
}

function validateValue(
  value: unknown,
  path: ObjectPath,
  root: unknown,
  objectSchema: ObjectSchema,
  parentSchema: FieldSchema | undefined,
  ancestors: readonly object[],
  issues: ValidationIssue[]
): void {
  const schema = resolveFieldSchema(
    objectSchema,
    root,
    value,
    path,
    parentSchema
  );
  const message = validateField(value, schema, { path, root });
  if (message) {
    issues.push(issue('invalid', path, message, schema?.severity ?? 'error'));
  }

  if (typeof value !== 'object' || value === null) return;
  if (ancestors.includes(value)) return;

  const nextAncestors = [...ancestors, value];
  reportMissingFields(value, schema?.fields, path, issues);

  for (const entry of dataEntries(value)) {
    validateValue(
      entry.value,
      [...path, entry.key],
      root,
      objectSchema,
      schema,
      nextAncestors,
      issues
    );
  }
}

function reportMissingFields(
  value: object,
  fields: Readonly<Record<string, FieldSchema>> | undefined,
  path: ObjectPath,
  issues: ValidationIssue[]
): void {
  for (const [key, field] of Object.entries(fields ?? {})) {
    if (field.required && !hasOwnProperty(value, key)) {
      issues.push(
        issue(
          'required',
          [...path, key],
          'Required property is missing',
          field.severity ?? 'error'
        )
      );
    }
  }
}

function dataEntries(
  value: object
): readonly { readonly key: string | number; readonly value: unknown }[] {
  try {
    const keys = Array.isArray(value)
      ? Array.from({ length: value.length }, (_, index) => index)
      : Object.keys(value);

    return keys.flatMap((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor && 'value' in descriptor
        ? [{ key, value: descriptor.value }]
        : [];
    });
  } catch {
    return [];
  }
}

function hasOwnProperty(value: object, key: string): boolean {
  try {
    return Object.hasOwn(value, key);
  } catch {
    return false;
  }
}

function issue(
  code: ValidationIssueCode,
  path: ObjectPath,
  message: string,
  severity: 'error' | 'warning'
): ValidationIssue {
  const stablePath = Object.freeze([...path]);
  return Object.freeze({
    code,
    message,
    path: stablePath,
    formattedPath: formatObjectPath(stablePath),
    severity
  });
}
