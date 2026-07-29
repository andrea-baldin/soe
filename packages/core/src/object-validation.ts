/**
 * Object validation collects resolved schema issues without rendering.
 */

import {
  resolveFieldSchema,
  validateFieldDiagnostics,
  type FieldSchema,
  type ObjectSchema
} from './object-schema.js';
import { formatObjectPath, type ObjectPath } from './object-path.js';

export type ValidationIssueCode = string;

export interface ValidationIssueInput {
  readonly code: ValidationIssueCode;
  readonly message: string;
  readonly path: ObjectPath;
  readonly severity: 'error' | 'warning';
}

export interface ValidationIssue extends ValidationIssueInput {
  readonly formattedPath: string;
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

export function mergeValidationIssues(
  ...groups: readonly (readonly ValidationIssueInput[] | undefined)[]
): readonly ValidationIssue[] {
  const seen = new Set<string>();
  return Object.freeze(
    groups.flatMap((group) =>
      (group ?? []).flatMap((candidate) => {
        if (!isValidationIssue(candidate)) return [];
        const formattedPath = formatObjectPath(candidate.path);
        const key = `${formattedPath}\u0000${candidate.code}\u0000${candidate.message}\u0000${candidate.severity}`;
        if (seen.has(key)) return [];
        seen.add(key);
        const path = Object.freeze([...candidate.path]);
        return [
          Object.freeze({
            code: candidate.code,
            message: candidate.message,
            path,
            formattedPath: formatObjectPath(path),
            severity: candidate.severity
          })
        ];
      })
    )
  );
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
  for (const diagnostic of validateFieldDiagnostics(value, schema, {
    path,
    root
  })) {
    issues.push(
      issue(
        diagnostic.code,
        path,
        diagnostic.message,
        diagnostic.severity ?? schema?.severity ?? 'error'
      )
    );
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
          field.messages?.required ?? 'Required property is missing',
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

function isValidationIssue(value: unknown): value is ValidationIssueInput {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ValidationIssue>;
  return (
    typeof candidate.code === 'string' &&
    Boolean(candidate.code) &&
    typeof candidate.message === 'string' &&
    Boolean(candidate.message) &&
    Array.isArray(candidate.path) &&
    (candidate.severity === 'error' || candidate.severity === 'warning')
  );
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
