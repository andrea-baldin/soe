import { describe, expect, it } from 'vitest';

import {
  applyObjectReplacements,
  applyStructuralOperation,
  composeObjectSchemas,
  createPluginHost,
  formatObjectPath,
  mergeValidationIssues,
  planObjectReplacements,
  schemaFieldSuggestions,
  schemaForPath,
  schemaForType,
  schemaInitialValue,
  searchObject,
  validateField,
  validateFieldDiagnostics,
  validateObject,
  validateObjectAsync,
  ValueHistory,
  type FieldSchema,
  type ObjectSchema,
  type ValidationIssueInput
} from './index.js';

describe('public API', () => {
  it('keeps legacy and 0.3 entry points available from the package root', () => {
    const functions = [
      applyObjectReplacements,
      applyStructuralOperation,
      composeObjectSchemas,
      createPluginHost,
      formatObjectPath,
      mergeValidationIssues,
      planObjectReplacements,
      schemaFieldSuggestions,
      schemaForPath,
      schemaForType,
      schemaInitialValue,
      searchObject,
      validateField,
      validateFieldDiagnostics,
      validateObject,
      validateObjectAsync
    ];

    expect(
      functions.every((candidate) => typeof candidate === 'function')
    ).toBe(true);
    expect(typeof ValueHistory).toBe('function');
  });

  it('keeps public schema and diagnostic types structurally usable', () => {
    const field: FieldSchema = {
      defaultValue: 'draft',
      enum: ['draft', 'published'],
      minimumLength: 3,
      severity: 'warning'
    };
    const schema: ObjectSchema = { fields: { status: field } };
    const issue: ValidationIssueInput = {
      code: 'status',
      message: 'Review status',
      path: ['status'],
      severity: 'warning'
    };

    expect(schema.fields.status).toBe(field);
    expect(mergeValidationIssues([issue])).toHaveLength(1);
  });
});
