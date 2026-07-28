/**
 * Object schemas add explicit knowledge without owning data or rendering.
 */

import type { ObjectPath } from './object-path.js';
import { objectValueKind, type ObjectValueKind } from './object-value.js';

export type SchemaValueType = 'boolean' | 'number' | 'string';
export type ValidationSeverity = 'error' | 'warning';

export interface FieldValidationContext {
  readonly path: ObjectPath;
  readonly root: unknown;
}

export type FieldValidator = (
  value: unknown,
  context: FieldValidationContext
) => string | undefined;

export interface FieldSchema {
  readonly additionalProperties?: boolean;
  readonly type?: SchemaValueType;
  readonly maximumItems?: number;
  readonly minimumItems?: number;
  readonly readonly?: boolean;
  readonly removable?: boolean;
  readonly renameable?: boolean;
  readonly required?: boolean;
  readonly severity?: ValidationSeverity;
  readonly fields?: Readonly<Record<string, FieldSchema>>;
  readonly items?: FieldSchema;
  readonly prefixItems?: readonly FieldSchema[];
  readonly validate?: FieldValidator;
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
    fields: schema.fields ? mergeFields(undefined, schema.fields) : undefined,
    items: schema.items ? stableFieldSchema(schema.items) : undefined,
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
