/**
 * Object replacement previews and applies textual edits as one immutable value.
 */

import {
  replaceValueAtPath,
  valueAtPath,
  type ObjectPath
} from './object-path.js';
import type { ObjectSearchResult } from './object-search.js';

export interface ObjectReplacement {
  readonly path: ObjectPath;
  readonly formattedPath: string;
  readonly previousValue: string;
  readonly nextValue: string;
}

export interface ObjectReplacementOptions {
  readonly canReplace?: (result: ObjectSearchResult) => boolean;
  readonly caseSensitive?: boolean;
}

export function planObjectReplacements(
  root: unknown,
  results: readonly ObjectSearchResult[],
  query: string,
  replacement: string,
  options: ObjectReplacementOptions = {}
): readonly ObjectReplacement[] {
  if (!query) return [];

  const planned = results.flatMap((result) => {
    if (options.canReplace && !options.canReplace(result)) return [];
    const current = valueAtPath(root, result.path);
    if (typeof current !== 'string') return [];
    const nextValue = replaceText(
      current,
      query,
      replacement,
      options.caseSensitive ?? false
    );
    if (nextValue === current) return [];
    return [
      Object.freeze({
        path: Object.freeze([...result.path]),
        formattedPath: result.formattedPath,
        previousValue: current,
        nextValue
      })
    ];
  });

  return Object.freeze(
    planned.filter(
      (candidate, index) =>
        planned.findIndex(
          (other) => other.formattedPath === candidate.formattedPath
        ) === index
    )
  );
}

export function applyObjectReplacements<T>(
  root: T,
  replacements: readonly ObjectReplacement[]
): T {
  return replacements.reduce<T>(
    (current, replacement) =>
      replaceValueAtPath(current, replacement.path, replacement.nextValue),
    root
  );
}

function replaceText(
  value: string,
  query: string,
  replacement: string,
  caseSensitive: boolean
): string {
  try {
    return value.replace(
      new RegExp(escapeRegExp(query), caseSensitive ? 'g' : 'gi'),
      () => replacement
    );
  } catch {
    return value;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
