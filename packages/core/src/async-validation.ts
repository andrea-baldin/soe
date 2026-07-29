/**
 * Async validation resolves cancellable diagnostics without owning UI state.
 */

import {
  normalizeFieldValidationResult,
  resolveFieldSchema,
  type FieldSchema,
  type FieldValidationDiagnostic,
  type ObjectSchema
} from './object-schema.js';
import { formatObjectPath, type ObjectPath } from './object-path.js';
import type { ValidationIssue } from './object-validation.js';

export interface AsyncValidationOptions {
  readonly signal?: AbortSignal;
}

export function hasAsyncValidation(schema: ObjectSchema | undefined): boolean {
  if (!schema) return false;
  return (
    Object.values(schema.fields).some(fieldHasAsyncValidation) ||
    (schema.rules ?? []).some((rule) => fieldHasAsyncValidation(rule.schema))
  );
}

export async function validateObjectAsync(
  root: unknown,
  schema: ObjectSchema | undefined,
  options: AsyncValidationOptions = {}
): Promise<readonly ValidationIssue[]> {
  if (!schema || options.signal?.aborted) return [];

  const controller = options.signal ? undefined : new AbortController();
  const signal = options.signal ?? controller!.signal;
  const tasks: Promise<readonly ValidationIssue[]>[] = [];
  collectTasks(root, [], root, schema, undefined, [], signal, tasks);
  const groups = await Promise.all(tasks);
  return signal.aborted ? [] : Object.freeze(groups.flat());
}

function collectTasks(
  value: unknown,
  path: ObjectPath,
  root: unknown,
  objectSchema: ObjectSchema,
  parentSchema: FieldSchema | undefined,
  ancestors: readonly object[],
  signal: AbortSignal,
  tasks: Promise<readonly ValidationIssue[]>[]
): void {
  if (signal.aborted) return;

  const schema = resolveFieldSchema(
    objectSchema,
    root,
    value,
    path,
    parentSchema
  );
  if (schema?.validateAsync) {
    tasks.push(runValidator(value, path, root, schema, signal));
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    ancestors.includes(value)
  ) {
    return;
  }

  const nextAncestors = [...ancestors, value];
  for (const entry of dataEntries(value)) {
    collectTasks(
      entry.value,
      [...path, entry.key],
      root,
      objectSchema,
      schema,
      nextAncestors,
      signal,
      tasks
    );
  }
}

async function runValidator(
  value: unknown,
  path: ObjectPath,
  root: unknown,
  schema: FieldSchema,
  signal: AbortSignal
): Promise<readonly ValidationIssue[]> {
  try {
    const result = await schema.validateAsync!(value, {
      path: Object.freeze([...path]),
      root,
      signal
    });
    if (signal.aborted) return [];
    return normalizeFieldValidationResult(result, schema.severity).map(
      (diagnostic) => issue(path, diagnostic)
    );
  } catch {
    if (signal.aborted) return [];
    return [
      issue(path, {
        code: 'async-validation',
        message:
          schema.messages?.asyncValidatorFailure ??
          'Async validation could not be completed',
        severity: schema.severity
      })
    ];
  }
}

function issue(
  path: ObjectPath,
  diagnostic: FieldValidationDiagnostic
): ValidationIssue {
  const stablePath = Object.freeze([...path]);
  return Object.freeze({
    code: diagnostic.code,
    message: diagnostic.message,
    path: stablePath,
    formattedPath: formatObjectPath(stablePath),
    severity: diagnostic.severity ?? 'error'
  });
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

function fieldHasAsyncValidation(schema: FieldSchema): boolean {
  return (
    Boolean(schema.validateAsync) ||
    Boolean(schema.items && fieldHasAsyncValidation(schema.items)) ||
    Boolean(schema.prefixItems?.some(fieldHasAsyncValidation)) ||
    Object.values(schema.fields ?? {}).some(fieldHasAsyncValidation)
  );
}
