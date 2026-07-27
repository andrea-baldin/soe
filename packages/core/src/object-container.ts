/**
 * Container helpers expose only data structures SOE can edit recursively.
 */

export interface ObjectEntry {
  key: string | number;
  value: unknown;
}

export type EditableContainer = Record<string, unknown> | readonly unknown[];

export function isEditableContainer(
  value: unknown
): value is EditableContainer {
  if (Array.isArray(value)) return true;
  if (typeof value !== 'object' || value === null) return false;

  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

export function objectEntries(
  value: EditableContainer
): readonly ObjectEntry[] {
  try {
    if (Array.isArray(value)) {
      return Array.from({ length: value.length }, (_, index) => ({
        key: index,
        value: readProperty(value, index)
      }));
    }

    return Object.keys(value).map((key) => ({
      key,
      value: readProperty(value, key)
    }));
  } catch {
    return [];
  }
}

export function parseObjectContainer(
  text: string,
  destination: EditableContainer
): EditableContainer | undefined {
  try {
    const value: unknown = JSON.parse(text);
    if (!isEditableContainer(value)) return undefined;
    if (Array.isArray(value) !== Array.isArray(destination)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

function readProperty(value: EditableContainer, key: string | number): unknown {
  try {
    return value[key as keyof EditableContainer];
  } catch {
    return undefined;
  }
}
