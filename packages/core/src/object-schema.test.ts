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
