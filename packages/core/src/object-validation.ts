/**
 * Object validation collects schema issues without depending on rendering.
 */

import {
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
}

export function validateObject(
  root: unknown,
  schema: ObjectSchema | undefined
): readonly ValidationIssue[] {
  if (!schema) return [];

  const issues: ValidationIssue[] = [];
  validateFields(root, schema.fields, [], root, [], issues);
  return issues;
}

function validateFields(
  value: unknown,
  fields: Readonly<Record<string, FieldSchema>>,
  path: ObjectPath,
  root: unknown,
  ancestors: readonly object[],
  issues: ValidationIssue[]
): void {
  if (typeof value !== 'object' || value === null) return;
  if (ancestors.includes(value)) return;

  const nextAncestors = [...ancestors, value];
  for (const [key, field] of Object.entries(fields)) {
    const fieldPath = [...path, key];
    const property = readOwnDataProperty(value, key);

    if (!property.present) {
      if (field.required) {
        issues.push(
          issue('required', fieldPath, 'Required property is missing')
        );
      }
      continue;
    }

    validateValue(
      property.value,
      field,
      fieldPath,
      root,
      nextAncestors,
      issues
    );
  }
}

function validateValue(
  value: unknown,
  schema: FieldSchema,
  path: ObjectPath,
  root: unknown,
  ancestors: readonly object[],
  issues: ValidationIssue[]
): void {
  const message = validateField(value, schema, { path, root });
  if (message) issues.push(issue('invalid', path, message));

  if (Array.isArray(value) && schema.items) {
    if (ancestors.includes(value)) return;
    const nextAncestors = [...ancestors, value];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, index);
      validateValue(
        descriptor?.value,
        schema.items,
        [...path, index],
        root,
        nextAncestors,
        issues
      );
    }
    return;
  }

  if (schema.fields) {
    validateFields(value, schema.fields, path, root, ancestors, issues);
  }
}

function issue(
  code: ValidationIssueCode,
  path: ObjectPath,
  message: string
): ValidationIssue {
  const stablePath = Object.freeze([...path]);
  return Object.freeze({
    code,
    message,
    path: stablePath,
    formattedPath: formatObjectPath(stablePath)
  });
}

function readOwnDataProperty(
  value: object,
  key: string
): { readonly present: boolean; readonly value?: unknown } {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) return { present: false };
    if ('value' in descriptor)
      return { present: true, value: descriptor.value };
    return { present: true, value: undefined };
  } catch {
    return { present: false };
  }
}
