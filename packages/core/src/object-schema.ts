/**
 * Object schemas add explicit knowledge without owning data or rendering.
 */

import type { ObjectPath } from './object-path.js';
import {
  objectValueKind,
  type EditableValue,
  type ObjectValueKind
} from './object-value.js';

export type SchemaValueType = 'boolean' | 'number' | 'string';
export type ValidationSeverity = 'error' | 'warning';
export type ValidationMessageKey =
  | 'asyncValidatorFailure'
  | 'enum'
  | 'maximum'
  | 'maximumLength'
  | 'minimum'
  | 'minimumLength'
  | 'pattern'
  | 'required'
  | 'type'
  | 'validatorFailure';
export type ValidationMessages = Readonly<
  Partial<Record<ValidationMessageKey, string>>
>;

export interface FieldValidationContext {
  readonly path: ObjectPath;
  readonly root: unknown;
}

export interface AsyncFieldValidationContext extends FieldValidationContext {
  readonly signal: AbortSignal;
}

export interface FieldValidationDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly severity?: ValidationSeverity;
}

export type FieldValidationResult =
  | string
  | FieldValidationDiagnostic
  | readonly FieldValidationDiagnostic[]
  | undefined;

export type FieldValidator = (
  value: unknown,
  context: FieldValidationContext
) => FieldValidationResult;

export type AsyncFieldValidator = (
  value: unknown,
  context: AsyncFieldValidationContext
) => Promise<FieldValidationResult>;

export interface FieldSchema {
  readonly additionalProperties?: boolean;
  readonly defaultValue?: unknown;
  readonly enum?: readonly EditableValue[];
  readonly type?: SchemaValueType;
  readonly maximumItems?: number;
  readonly maximum?: number;
  readonly maximumLength?: number;
  readonly minimum?: number;
  readonly minimumItems?: number;
  readonly minimumLength?: number;
  readonly messages?: ValidationMessages;
  readonly pattern?: RegExp;
  readonly readonly?: boolean;
  readonly removable?: boolean;
  readonly renameable?: boolean;
  readonly required?: boolean;
  readonly severity?: ValidationSeverity;
  readonly fields?: Readonly<Record<string, FieldSchema>>;
  readonly items?: FieldSchema;
  readonly prefixItems?: readonly FieldSchema[];
  readonly validate?: FieldValidator;
  readonly validateAsync?: AsyncFieldValidator;
}

export function inheritFieldSchema(
  schema: FieldSchema | undefined,
  parent: FieldSchema | undefined
): FieldSchema | undefined {
  if (!parent?.readonly) return schema;
  if (schema?.readonly) return schema;
  return { ...schema, readonly: true };
}

export interface ObjectSchema {
  readonly fields: Readonly<Record<string, FieldSchema>>;
  readonly rules?: readonly SchemaRule[];
}

export type SchemaPathPattern = readonly (ObjectPath[number] | '*')[];

export interface SchemaRuleContext {
  readonly path: ObjectPath;
  readonly root: unknown;
  readonly value: unknown;
}

export interface SchemaRule {
  readonly kind?: ObjectValueKind;
  readonly path?: SchemaPathPattern;
  readonly when?: (context: SchemaRuleContext) => boolean;
  readonly schema: FieldSchema;
}

export function schemaForType(
  kind: ObjectValueKind,
  schema: FieldSchema
): ObjectSchema {
  return { fields: {}, rules: [{ kind, schema }] };
}

export function schemaForPath(
  path: SchemaPathPattern,
  schema: FieldSchema
): ObjectSchema {
  return { fields: {}, rules: [{ path: [...path], schema }] };
}

export function schemaWhen(
  when: (context: SchemaRuleContext) => boolean,
  schema: FieldSchema
): ObjectSchema {
  return { fields: {}, rules: [{ when, schema }] };
}

export function composeObjectSchemas(
  ...schemas: readonly (ObjectSchema | undefined)[]
): ObjectSchema {
  return Object.freeze({
    fields: schemas.reduce<Readonly<Record<string, FieldSchema>>>(
      (fields, schema) => mergeFields(fields, schema?.fields),
      {}
    ),
    rules: Object.freeze(
      schemas.flatMap((schema) => schema?.rules ?? []).map(stableRule)
    )
  });
}

export function resolveFieldSchema(
  schema: ObjectSchema | undefined,
  root: unknown,
  value: unknown,
  path: ObjectPath,
  parent?: FieldSchema
): FieldSchema | undefined {
  if (!schema) return undefined;

  const context: SchemaRuleContext = Object.freeze({
    root,
    value,
    path: Object.freeze([...path])
  });
  let resolved: FieldSchema | undefined;

  for (const rule of schema.rules ?? []) {
    if (matchesRule(rule, context)) {
      resolved = mergeFieldSchemas(resolved, rule.schema);
    }
  }

  const explicit =
    path.length === 0
      ? ({ fields: schema.fields } satisfies FieldSchema)
      : fieldSchemaAtPath(schema, path);
  resolved = mergeFieldSchemas(resolved, explicit);
  return inheritFieldSchema(resolved, parent);
}

export function mergeFieldSchemas(
  base: FieldSchema | undefined,
  override: FieldSchema | undefined
): FieldSchema | undefined {
  if (!base) return override ? stableFieldSchema(override) : undefined;
  if (!override) return stableFieldSchema(base);

  return Object.freeze({
    ...base,
    ...override,
    fields: mergeFields(base.fields, override.fields),
    items: mergeFieldSchemas(base.items, override.items),
    messages: mergeMessages(base.messages, override.messages),
    prefixItems: mergePrefixItems(base.prefixItems, override.prefixItems)
  });
}

export function missingRequiredFields(
  value: unknown,
  fields: Readonly<Record<string, FieldSchema>> | undefined
): readonly string[] {
  if (!fields || typeof value !== 'object' || value === null) return [];

  try {
    return Object.entries(fields)
      .filter(([key, field]) => field.required && !Object.hasOwn(value, key))
      .map(([key]) => key);
  } catch {
    return [];
  }
}

export function fieldSchemaAtPath(
  schema: ObjectSchema | undefined,
  path: ObjectPath
): FieldSchema | undefined {
  let field: FieldSchema | undefined;

  for (const segment of path) {
    if (typeof segment === 'number') {
      field = mergeFieldSchemas(field?.items, field?.prefixItems?.[segment]);
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
  return validateFieldDiagnostics(value, schema, context)[0]?.message;
}

export function validateFieldDiagnostics(
  value: unknown,
  schema: FieldSchema | undefined,
  context: FieldValidationContext
): readonly FieldValidationDiagnostic[] {
  if (!schema) return [];

  const message = declarativeValidationMessage(value, schema);
  if (message) {
    return stableDiagnostics([
      { code: 'invalid', message, severity: schema.severity }
    ]);
  }

  if (!schema.validate) return [];

  try {
    return normalizeFieldValidationResult(
      schema.validate(value, context),
      schema.severity
    );
  } catch {
    return stableDiagnostics([
      {
        code: 'invalid',
        message:
          schema.messages?.validatorFailure ??
          'Validation could not be completed',
        severity: schema.severity
      }
    ]);
  }
}

function declarativeValidationMessage(
  value: unknown,
  schema: FieldSchema
): string | undefined {
  if (schema.type && !matchesType(value, schema.type)) {
    return schema.messages?.type ?? `Expected ${schema.type}`;
  }

  if (
    schema.enum?.length &&
    !schema.enum.some((entry) => Object.is(entry, value))
  ) {
    return schema.messages?.enum ?? 'Expected one of the allowed values';
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      return schema.messages?.minimum ?? `Must be at least ${schema.minimum}`;
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      return schema.messages?.maximum ?? `Must be at most ${schema.maximum}`;
    }
  }

  if (typeof value === 'string') {
    if (
      schema.minimumLength !== undefined &&
      value.length < schema.minimumLength
    ) {
      return (
        schema.messages?.minimumLength ??
        `Must contain at least ${schema.minimumLength} characters`
      );
    }
    if (
      schema.maximumLength !== undefined &&
      value.length > schema.maximumLength
    ) {
      return (
        schema.messages?.maximumLength ??
        `Must contain at most ${schema.maximumLength} characters`
      );
    }
    if (schema.pattern && !matchesPattern(value, schema.pattern)) {
      return schema.messages?.pattern ?? `Must match ${schema.pattern}`;
    }
  }

  return undefined;
}

export function normalizeFieldValidationResult(
  result: FieldValidationResult,
  defaultSeverity: ValidationSeverity | undefined
): readonly FieldValidationDiagnostic[] {
  const candidates =
    typeof result === 'string'
      ? result
        ? [{ code: 'invalid', message: result }]
        : []
      : Array.isArray(result)
        ? result
        : result
          ? [result]
          : [];
  const seen = new Set<string>();

  return stableDiagnostics(
    candidates.flatMap((candidate) => {
      if (
        !candidate ||
        typeof candidate.code !== 'string' ||
        !candidate.code ||
        typeof candidate.message !== 'string' ||
        !candidate.message
      ) {
        return [];
      }
      const severity = candidate.severity ?? defaultSeverity ?? 'error';
      const key = `${candidate.code}\u0000${candidate.message}\u0000${severity}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ code: candidate.code, message: candidate.message, severity }];
    })
  );
}

function stableDiagnostics(
  diagnostics: readonly FieldValidationDiagnostic[]
): readonly FieldValidationDiagnostic[] {
  return Object.freeze(
    diagnostics.map((diagnostic) =>
      Object.freeze({
        ...diagnostic,
        severity: diagnostic.severity ?? 'error'
      })
    )
  );
}

function matchesPattern(value: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  const matches = pattern.test(value);
  pattern.lastIndex = 0;
  return matches;
}

function matchesType(value: unknown, type: SchemaValueType): boolean {
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === type;
}

function matchesRule(rule: SchemaRule, context: SchemaRuleContext): boolean {
  if (rule.kind && objectValueKind(context.value) !== rule.kind) return false;
  if (rule.path && !matchesPath(context.path, rule.path)) return false;
  if (!rule.when) return true;

  try {
    return rule.when(context) === true;
  } catch {
    return false;
  }
}

function matchesPath(path: ObjectPath, pattern: SchemaPathPattern): boolean {
  return (
    path.length === pattern.length &&
    pattern.every(
      (segment, index) => segment === '*' || segment === path[index]
    )
  );
}

function mergeFields(
  base: Readonly<Record<string, FieldSchema>> | undefined,
  override: Readonly<Record<string, FieldSchema>> | undefined
): Readonly<Record<string, FieldSchema>> {
  const keys = new Set([
    ...Object.keys(base ?? {}),
    ...Object.keys(override ?? {})
  ]);
  return Object.freeze(
    Object.fromEntries(
      [...keys].map((key) => [
        key,
        mergeFieldSchemas(base?.[key], override?.[key]) ?? {}
      ])
    )
  );
}

function stableFieldSchema(schema: FieldSchema): FieldSchema {
  return Object.freeze({
    ...schema,
    ...(Object.hasOwn(schema, 'defaultValue')
      ? { defaultValue: stableSchemaValue(schema.defaultValue) }
      : {}),
    enum: schema.enum ? Object.freeze([...schema.enum]) : undefined,
    fields: schema.fields ? mergeFields(undefined, schema.fields) : undefined,
    items: schema.items ? stableFieldSchema(schema.items) : undefined,
    messages: mergeMessages(undefined, schema.messages),
    prefixItems: schema.prefixItems
      ? Object.freeze(schema.prefixItems.map(stableFieldSchema))
      : undefined
  });
}

function stableRule(rule: SchemaRule): SchemaRule {
  return Object.freeze({
    ...rule,
    path: rule.path ? Object.freeze([...rule.path]) : undefined,
    schema: stableFieldSchema(rule.schema)
  });
}

function mergePrefixItems(
  base: readonly FieldSchema[] | undefined,
  override: readonly FieldSchema[] | undefined
): readonly FieldSchema[] | undefined {
  if (!base && !override) return undefined;

  const length = Math.max(base?.length ?? 0, override?.length ?? 0);
  return Object.freeze(
    Array.from({ length }, (_, index) =>
      mergeFieldSchemas(base?.[index], override?.[index])
    ).map((schema) => schema ?? Object.freeze({}))
  );
}

function mergeMessages(
  base: ValidationMessages | undefined,
  override: ValidationMessages | undefined
): ValidationMessages | undefined {
  if (!base && !override) return undefined;
  return Object.freeze({ ...base, ...override });
}

function stableSchemaValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    value === undefined
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map(stableSchemaValue));
  }
  if (
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          stableSchemaValue(entry)
        ])
      )
    );
  }
  return value;
}
