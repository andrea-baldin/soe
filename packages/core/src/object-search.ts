/**
 * Object search traverses editable and inspected values without invoking accessors.
 */

import { isEditableContainer } from './object-container.js';
import {
  inspectionEntries,
  isInspectableContainer,
  type InspectionEntry
} from './object-inspection.js';
import { formatObjectPath, type ObjectPath } from './object-path.js';
import { formatObjectValue } from './object-value.js';

export interface ObjectSearchResult {
  readonly path: ObjectPath;
  readonly formattedPath: string;
  readonly value: unknown;
}

export function searchObject(
  root: unknown,
  query: string,
  limit = 100
): readonly ObjectSearchResult[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized || limit <= 0) return [];

  const results: ObjectSearchResult[] = [];
  visit(root, [], [], normalized, limit, results);
  return results;
}

function visit(
  value: unknown,
  path: ObjectPath,
  ancestors: readonly object[],
  query: string,
  limit: number,
  results: ObjectSearchResult[]
): void {
  if (results.length >= limit) return;

  const formattedPath = formatObjectPath(path);
  if (
    path.length > 0 &&
    safelyIncludes(formattedPath, query, formatObjectValue(value))
  ) {
    results.push({ path: Object.freeze([...path]), formattedPath, value });
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    ancestors.includes(value)
  ) {
    return;
  }

  const entries = searchableEntries(value);
  if (!entries.length) return;

  const nextAncestors = [...ancestors, value];
  for (const entry of entries) {
    visit(
      entry.value,
      [...path, entry.key],
      nextAncestors,
      query,
      limit,
      results
    );
    if (results.length >= limit) return;
  }
}

function searchableEntries(value: object): readonly InspectionEntry[] {
  try {
    if (!isEditableContainer(value)) {
      return isInspectableContainer(value) ? inspectionEntries(value) : [];
    }

    if (Array.isArray(value)) {
      return Array.from({ length: value.length }, (_, index) => ({
        key: index,
        value: Object.getOwnPropertyDescriptor(value, index)?.value
      }));
    }

    return Object.keys(value).map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return {
        key,
        value:
          descriptor && 'value' in descriptor
            ? descriptor.value
            : descriptor?.get
              ? '[Getter]'
              : descriptor?.set
                ? '[Setter]'
                : 'Unavailable'
      };
    });
  } catch {
    return [];
  }
}

function safelyIncludes(
  path: string,
  query: string,
  formattedValue: string
): boolean {
  try {
    return (
      path.toLocaleLowerCase().includes(query) ||
      formattedValue.toLocaleLowerCase().includes(query)
    );
  } catch {
    return false;
  }
}
