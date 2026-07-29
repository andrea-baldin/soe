import { describe, expect, it, vi } from 'vitest';

import {
  composeObjectSchemas,
  fieldSchemaAtPath,
  missingRequiredFields,
  resolveFieldSchema,
  schemaForPath,
  schemaForType,
  schemaWhen,
  validateField,
  validateFieldDiagnostics,
  type ObjectSchema
} from './object-schema.js';

const schema: ObjectSchema = {
  fields: {
    name: { type: 'string' },
    orders: {
      items: {
        fields: {
          price: { type: 'number' }
        }
      }
    }
  }
};

describe('object schema', () => {
  it('resolves object fields and array items by path', () => {
    expect(fieldSchemaAtPath(schema, ['name'])?.type).toBe('string');
    expect(fieldSchemaAtPath(schema, ['orders', 2, 'price'])?.type).toBe(
      'number'
    );
    expect(fieldSchemaAtPath(schema, ['missing'])).toBeUndefined();
  });

  it('applies positional tuple knowledge over general array items', () => {
    const tupleSchema: ObjectSchema = {
      fields: {
        coordinates: {
          items: { readonly: true },
          prefixItems: [{ type: 'number' }, { type: 'string', readonly: false }]
        }
      }
    };

    expect(fieldSchemaAtPath(tupleSchema, ['coordinates', 0])).toMatchObject({
      type: 'number',
      readonly: true
    });
    expect(fieldSchemaAtPath(tupleSchema, ['coordinates', 1])).toMatchObject({
      type: 'string',
      readonly: false
    });
    expect(fieldSchemaAtPath(tupleSchema, ['coordinates', 2])).toMatchObject({
      readonly: true
    });
  });

  it('composes positional tuple schemas by index without mutating inputs', () => {
    const base = {
      fields: {
        row: {
          prefixItems: [{ type: 'string' as const }, { required: true }]
        }
      }
    };
    const override = {
      fields: {
        row: {
          prefixItems: [{ readonly: true }, { type: 'number' as const }]
        }
      }
    };
    const composed = composeObjectSchemas(base, override);

    expect(fieldSchemaAtPath(composed, ['row', 0])).toMatchObject({
      type: 'string',
      readonly: true
    });
    expect(fieldSchemaAtPath(composed, ['row', 1])).toMatchObject({
      type: 'number',
      required: true
    });
    expect(Object.isFrozen(composed.fields.row?.prefixItems)).toBe(true);
    expect(base.fields.row.prefixItems[0]).toEqual({ type: 'string' });
  });

  it('composes type, predicate, and path knowledge in precedence order', () => {
    const root = { orders: [{ discount: 15 }] };
    const composed = composeObjectSchemas(
      schemaForType('number', {
        readonly: true,
        validate: () => 'General number'
      }),
      schemaWhen(({ path }) => path.at(-1) === 'discount', {
        removable: false
      }),
      schemaForPath(['orders', '*', 'discount'], {
        readonly: false,
        validate: (value) =>
          Number(value) <= 20 ? undefined : 'Discount is too large'
      })
    );

    expect(
      resolveFieldSchema(composed, root, root.orders[0]!.discount, [
        'orders',
        0,
        'discount'
      ])
    ).toMatchObject({
      readonly: false,
      removable: false
    });
  });

  it('lets explicit field knowledge override general type rules', () => {
    const composed = composeObjectSchemas(
      schemaForType('string', { readonly: true }),
      {
        fields: {
          name: { readonly: false, required: true }
        }
      }
    );

    expect(
      resolveFieldSchema(composed, { name: 'Ada' }, 'Ada', ['name'])
    ).toMatchObject({
      readonly: false,
      required: true
    });
  });

  it('isolates failing schema predicates', () => {
    const composed = schemaWhen(
      () => {
        throw new Error('Failure');
      },
      { readonly: true }
    );

    expect(resolveFieldSchema(composed, {}, 'value', ['name'])).toBeUndefined();
  });

  it('validates the explicit type before a custom validator', () => {
    const validator = vi.fn(() => 'Custom error');
    const context = { path: ['age'], root: { age: '36' } };

    expect(
      validateField('36', { type: 'number', validate: validator }, context)
    ).toBe('Expected number');
    expect(validator).not.toHaveBeenCalled();
  });

  it('provides root and path to custom validation', () => {
    const root = { minimum: 18, age: 16 };
    const validator = vi.fn((value: unknown, context: { root: unknown }) =>
      Number(value) < (context.root as typeof root).minimum
        ? 'Too young'
        : undefined
    );

    expect(
      validateField(
        root.age,
        { validate: validator },
        {
          path: ['age'],
          root
        }
      )
    ).toBe('Too young');
    expect(validator).toHaveBeenCalledWith(root.age, {
      path: ['age'],
      root
    });
  });

  it('contains validator failures', () => {
    expect(
      validateField(
        'value',
        {
          validate() {
            throw new Error('Failure');
          }
        },
        { path: ['field'], root: {} }
      )
    ).toBe('Validation could not be completed');
  });

  it('validates declarative number and string constraints before custom validators', () => {
    const custom = vi.fn(() => 'Custom error');

    expect(
      validateField(4, { minimum: 5, validate: custom }, { path: [], root: {} })
    ).toBe('Must be at least 5');
    expect(validateField(11, { maximum: 10 }, { path: [], root: {} })).toBe(
      'Must be at most 10'
    );
    expect(
      validateField('ab', { minimumLength: 3 }, { path: [], root: {} })
    ).toBe('Must contain at least 3 characters');
    expect(
      validateField('abcd', { maximumLength: 3 }, { path: [], root: {} })
    ).toBe('Must contain at most 3 characters');
    expect(
      validateField('ABC', { pattern: /^\d+$/ }, { path: [], root: {} })
    ).toBe('Must match /^\\d+$/');
    expect(custom).not.toHaveBeenCalled();
  });

  it('resets stateful regular expressions between validations', () => {
    const pattern = /^A/g;
    const field = { pattern };
    const context = { path: ['code'], root: {} };

    expect(validateField('Ada', field, context)).toBeUndefined();
    expect(validateField('Ada', field, context)).toBeUndefined();
    expect(pattern.lastIndex).toBe(0);
  });

  it('uses declarative validation messages with existing defaults as fallback', () => {
    const context = { path: ['value'], root: {} };

    expect(
      validateField(
        -1,
        {
          minimum: 0,
          messages: { minimum: 'Il valore deve essere positivo' }
        },
        context
      )
    ).toBe('Il valore deve essere positivo');
    expect(validateField(11, { maximum: 10 }, context)).toBe(
      'Must be at most 10'
    );
    expect(
      validateField(
        'value',
        {
          messages: { validatorFailure: 'Validazione non disponibile' },
          validate() {
            throw new Error('Failure');
          }
        },
        context
      )
    ).toBe('Validazione non disponibile');
  });

  it('normalizes, defaults, freezes, and deduplicates structured diagnostics', () => {
    const diagnostics = validateFieldDiagnostics(
      120,
      {
        severity: 'warning',
        validate: () => [
          { code: 'unusual', message: 'Value is unusually high' },
          { code: 'unusual', message: 'Value is unusually high' },
          {
            code: 'blocked',
            message: 'Value is not permitted',
            severity: 'error'
          }
        ]
      },
      { path: ['value'], root: {} }
    );

    expect(diagnostics).toEqual([
      {
        code: 'unusual',
        message: 'Value is unusually high',
        severity: 'warning'
      },
      {
        code: 'blocked',
        message: 'Value is not permitted',
        severity: 'error'
      }
    ]);
    expect(Object.isFrozen(diagnostics)).toBe(true);
    expect(diagnostics.every(Object.isFrozen)).toBe(true);
    expect(
      validateField(
        120,
        { validate: () => diagnostics },
        {
          path: ['value'],
          root: {}
        }
      )
    ).toBe('Value is unusually high');
  });

  it('composes individual validation messages from general to specific schemas', () => {
    const composed = composeObjectSchemas(
      schemaForType('number', {
        messages: {
          minimum: 'General minimum',
          maximum: 'General maximum'
        },
        minimum: 0,
        maximum: 100
      }),
      {
        fields: {
          discount: {
            maximum: 30,
            messages: { maximum: 'Discount cannot exceed 30%' }
          }
        }
      }
    );
    const resolved = resolveFieldSchema(composed, { discount: 40 }, 40, [
      'discount'
    ]);

    expect(resolved?.messages).toEqual({
      minimum: 'General minimum',
      maximum: 'Discount cannot exceed 30%'
    });
    expect(
      validateField(40, resolved, {
        path: ['discount'],
        root: { discount: 40 }
      })
    ).toBe('Discount cannot exceed 30%');
  });

  it('reports missing required own properties without reading values', () => {
    let getterCalls = 0;
    const value = Object.create({ inherited: true }) as Record<string, unknown>;
    Object.defineProperty(value, 'present', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'value';
      }
    });

    expect(
      missingRequiredFields(value, {
        inherited: { required: true },
        missing: { required: true },
        optional: {},
        present: { required: true }
      })
    ).toEqual(['inherited', 'missing']);
    expect(getterCalls).toBe(0);
  });
});
