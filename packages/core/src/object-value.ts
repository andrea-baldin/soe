/**
 * Object values are classified conservatively so unknown JavaScript values
 * remain inspectable without making the editor fragile.
 */

export type EditableValue = string | number | boolean | null;

export type ObjectValueKind =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'function'
  | 'map'
  | 'null'
  | 'number'
  | 'object'
  | 'regexp'
  | 'set'
  | 'string'
  | 'symbol'
  | 'undefined'
  | 'url';

export function isEditableValue(value: unknown): value is EditableValue {
  return (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'boolean' ||
    value === null
  );
}

export function objectValueKind(value: unknown): ObjectValueKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regexp';
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  if (value instanceof URL) return 'url';

  switch (typeof value) {
    case 'bigint':
      return 'bigint';
    case 'boolean':
      return 'boolean';
    case 'function':
      return 'function';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'symbol':
      return 'symbol';
    case 'undefined':
      return 'undefined';
    default:
      return 'object';
  }
}

export function formatObjectValue(value: unknown): string {
  try {
    switch (objectValueKind(value)) {
      case 'array':
        return `Array(${(value as unknown[]).length})`;
      case 'bigint':
        return `${String(value)}n`;
      case 'date': {
        const date = value as Date;
        return Number.isNaN(date.getTime())
          ? 'Invalid Date'
          : date.toISOString().slice(0, 10);
      }
      case 'function':
        return 'function()';
      case 'map':
        return `Map(${(value as Map<unknown, unknown>).size})`;
      case 'null':
        return 'null';
      case 'object':
        return formatObject(value as object);
      case 'regexp':
      case 'string':
      case 'symbol':
      case 'undefined':
      case 'url':
        return String(value);
      case 'number':
        return Number.isNaN(value) ? 'NaN' : String(value);
      case 'set':
        return `Set(${(value as Set<unknown>).size})`;
      case 'boolean':
        return value ? 'true' : 'false';
    }
  } catch {
    return 'Unknown value';
  }
}

export function serializeObjectValue(value: unknown): string {
  if (!isEditableContainerValue(value)) return formatObjectValue(value);

  try {
    const serialized = JSON.stringify(value, null, 2);
    return typeof serialized === 'string'
      ? serialized
      : formatObjectValue(value);
  } catch {
    return formatObjectValue(value);
  }
}

function isEditableContainerValue(value: unknown): boolean {
  if (Array.isArray(value)) return true;
  if (typeof value !== 'object' || value === null) return false;

  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function formatObject(value: object): string {
  const constructorName = value.constructor?.name;

  if (constructorName && constructorName !== 'Object') {
    return `${constructorName}(…)`;
  }

  return 'Object';
}
