/**
 * Object inspection exposes special values without invoking user code.
 */

import { formatObjectValue } from './object-value.js';

export interface InspectionEntry {
  readonly key: string | number;
  readonly value: unknown;
}

export function isInspectableContainer(value: unknown): boolean {
  if (value instanceof Map || value instanceof Set) return true;
  if (typeof value !== 'object' || value === null) return false;

  try {
    return (
      !(value instanceof Date) &&
      !(value instanceof RegExp) &&
      !(value instanceof URL) &&
      Reflect.ownKeys(value).length > 0
    );
  } catch {
    return false;
  }
}

export function inspectionEntries(value: unknown): readonly InspectionEntry[] {
  try {
    if (value instanceof Map) {
      return [...value.entries()].map(([key, entryValue], index) => ({
        key: `[${index}] ${formatObjectValue(key)}`,
        value: entryValue
      }));
    }
    if (value instanceof Set) {
      return [...value.values()].map((entryValue, index) => ({
        key: index,
        value: entryValue
      }));
    }
    if (typeof value !== 'object' || value === null) return [];

    return Reflect.ownKeys(value).map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return {
        key: typeof key === 'symbol' ? String(key) : key,
        value:
          descriptor && 'value' in descriptor
            ? descriptor.value
            : accessorSummary(descriptor)
      };
    });
  } catch {
    return [];
  }
}

function accessorSummary(descriptor: PropertyDescriptor | undefined): string {
  if (!descriptor) return 'Unavailable';
  if (descriptor.get && descriptor.set) return '[Getter/Setter]';
  if (descriptor.get) return '[Getter]';
  if (descriptor.set) return '[Setter]';
  return 'Unavailable';
}
