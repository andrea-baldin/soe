import { describe, expect, it, vi } from 'vitest';

import {
  fieldSchemaAtPath,
  missingRequiredFields,
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
