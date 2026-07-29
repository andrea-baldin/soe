/**
 * Object search traverses values safely and ranks structured queries.
 */

import { isEditableContainer } from './object-container.js';
import {
  inspectionEntries,
  isInspectableContainer,
  type InspectionEntry
} from './object-inspection.js';
import { formatObjectPath, type ObjectPath } from './object-path.js';
import {
  formatObjectValue,
  objectValueKind,
  type ObjectValueKind
} from './object-value.js';
import type { ValidationIssueInput } from './object-validation.js';

export type ObjectSearchMode = 'contains' | 'fuzzy';
export type ObjectSearchScope = 'all' | 'path' | 'value';
export type ObjectSearchValidationFilter =
  'all' | 'errors' | 'issues' | 'warnings';

export interface ObjectSearchQuery {
  readonly kinds?: readonly ObjectValueKind[];
  readonly limit?: number;
  readonly mode?: ObjectSearchMode;
  readonly query: string;
  readonly scope?: ObjectSearchScope;
  readonly validation?: ObjectSearchValidationFilter;
  readonly validationIssues?: readonly ValidationIssueInput[];
}

export interface ObjectSearchResult {
  readonly path: ObjectPath;
  readonly formattedPath: string;
  readonly value: unknown;
  readonly kind: ObjectValueKind;
  readonly matchedIn: 'path' | 'value';
  readonly score: number;
}

export function searchObject(
  root: unknown,
  query: string,
  limit?: number
): readonly ObjectSearchResult[];
export function searchObject(
  root: unknown,
  query: ObjectSearchQuery
): readonly ObjectSearchResult[];
export function searchObject(
  root: unknown,
  query: ObjectSearchQuery | string,
  limit = 100
): readonly ObjectSearchResult[] {
  const options: ObjectSearchQuery =
    typeof query === 'string' ? { query, limit } : query;
  const normalized = normalize(options.query);
  const resultLimit = options.limit ?? 100;
  if (!normalized || resultLimit <= 0) return [];

  const results: ObjectSearchResult[] = [];
  visit(root, [], [], normalized, options, results);
  return Object.freeze(
    results
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.formattedPath.localeCompare(right.formattedPath)
      )
      .slice(0, resultLimit)
  );
}

function visit(
  value: unknown,
  path: ObjectPath,
  ancestors: readonly object[],
  query: string,
  options: ObjectSearchQuery,
  results: ObjectSearchResult[]
): void {
  const formattedPath = formatObjectPath(path);
  const kind = objectValueKind(value);
  if (path.length > 0 && matchesFilters(formattedPath, kind, options)) {
    const match = bestMatch(
      formattedPath,
      formatObjectValue(value),
      query,
      options
    );
    if (match) {
      results.push({
        path: Object.freeze([...path]),
        formattedPath,
        value,
        kind,
        matchedIn: match.matchedIn,
        score: match.score
      });
    }
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    ancestors.includes(value)
  ) {
    return;
  }

  const nextAncestors = [...ancestors, value];
  for (const entry of searchableEntries(value)) {
    visit(
      entry.value,
      [...path, entry.key],
      nextAncestors,
      query,
      options,
      results
    );
  }
}

function matchesFilters(
  formattedPath: string,
  kind: ObjectValueKind,
  options: ObjectSearchQuery
): boolean {
  if (options.kinds?.length && !options.kinds.includes(kind)) return false;
  const filter = options.validation ?? 'all';
  if (filter === 'all') return true;
  const issues = (options.validationIssues ?? []).filter(
    (issue) => formatObjectPath(issue.path) === formattedPath
  );
  if (filter === 'issues') return issues.length > 0;
  return issues.some((issue) =>
    filter === 'errors'
      ? issue.severity === 'error'
      : issue.severity === 'warning'
  );
}

function bestMatch(
  path: string,
  value: string,
  query: string,
  options: ObjectSearchQuery
):
  { readonly matchedIn: 'path' | 'value'; readonly score: number } | undefined {
  const scope = options.scope ?? 'all';
  const candidates = [
    ...(scope !== 'value' ? [{ matchedIn: 'path' as const, text: path }] : []),
    ...(scope !== 'path' ? [{ matchedIn: 'value' as const, text: value }] : [])
  ];
  const matches = candidates.flatMap((candidate) => {
    const score = matchScore(candidate.text, query, options.mode ?? 'contains');
    return score === undefined ? [] : [{ ...candidate, score }];
  });
  return matches.sort((left, right) => right.score - left.score)[0];
}

function matchScore(
  text: string,
  query: string,
  mode: ObjectSearchMode
): number | undefined {
  const normalized = normalize(text);
  const exactIndex = normalized.indexOf(query);
  if (exactIndex >= 0) {
    return 1000 - exactIndex - Math.max(0, normalized.length - query.length);
  }
  if (mode !== 'fuzzy') return undefined;

  let cursor = 0;
  let first = -1;
  let last = -1;
  for (const character of query) {
    const index = normalized.indexOf(character, cursor);
    if (index < 0) return undefined;
    if (first < 0) first = index;
    last = index;
    cursor = index + 1;
  }
  return 500 - first - (last - first + 1 - query.length);
}

function normalize(value: string): string {
  try {
    return value.trim().toLocaleLowerCase();
  } catch {
    return '';
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
