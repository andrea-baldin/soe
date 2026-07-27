/**
 * Object paths identify values without introducing a stateful node model.
 */

import { isEditableContainer } from './object-container.js';

export type ObjectPathSegment = string | number;
export type ObjectPath = readonly ObjectPathSegment[];

export function formatObjectPath(path: ObjectPath): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number') return `${formatted}[${segment}]`;
    if (/^[A-Za-z_$][\w$]*$/.test(segment)) {
      return formatted ? `${formatted}.${segment}` : segment;
    }

    return `${formatted}[${JSON.stringify(segment)}]`;
  }, '');
}

export function replaceValueAtPath<T>(
  root: T,
  path: ObjectPath,
  replacement: unknown
): T {
  if (path.length === 0) return replacement as T;

  try {
    const updated = replaceNestedValue(root, path, 0, replacement);
    return (updated.changed ? updated.value : root) as T;
  } catch {
    return root;
  }
}

export function valueAtPath(root: unknown, path: ObjectPath): unknown {
  try {
    return path.reduce<unknown>((current, segment) => {
      if (Array.isArray(current) && typeof segment === 'number') {
        if (segment < 0 || segment >= current.length) return undefined;
        return current[segment];
      }

      if (
        isEditableContainer(current) &&
        !Array.isArray(current) &&
        typeof segment === 'string' &&
        Object.hasOwn(current, segment)
      ) {
        return (current as Record<string, unknown>)[segment];
      }

      return undefined;
    }, root);
  } catch {
    return undefined;
  }
}

interface ReplacementResult {
  changed: boolean;
  value: unknown;
}

function replaceNestedValue(
  current: unknown,
  path: ObjectPath,
  offset: number,
  replacement: unknown
): ReplacementResult {
  if (offset === path.length) {
    return {
      changed: !Object.is(current, replacement),
      value: replacement
    };
  }

  const segment = path[offset];

  if (Array.isArray(current) && typeof segment === 'number') {
    if (segment < 0 || segment >= current.length) {
      return { changed: false, value: current };
    }

    const child = replaceNestedValue(
      current[segment],
      path,
      offset + 1,
      replacement
    );
    if (!child.changed) return { changed: false, value: current };

    const clone = current.slice();
    clone[segment] = child.value;
    return { changed: true, value: clone };
  }

  if (
    isEditableContainer(current) &&
    !Array.isArray(current) &&
    typeof segment === 'string'
  ) {
    const record = current as Record<string, unknown>;

    if (!Object.hasOwn(record, segment)) {
      return { changed: false, value: current };
    }

    let currentValue: unknown;
    try {
      currentValue = record[segment];
    } catch {
      return { changed: false, value: current };
    }

    const child = replaceNestedValue(
      currentValue,
      path,
      offset + 1,
      replacement
    );
    if (!child.changed) return { changed: false, value: current };

    return {
      changed: true,
      value: { ...record, [segment]: child.value }
    };
  }

  return { changed: false, value: current };
}
