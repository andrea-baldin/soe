import { describe, expect, it } from 'vitest';

import { validateObject } from './object-validation.js';
import {
  composeObjectSchemas,
  schemaForPath,
  schemaForType
} from './object-schema.js';

describe('validateObject', () => {
  it('collects nested field and array item issues', () => {
    const value = {
      orders: [{ price: -1 }, { price: 10 }]
    };
    const issues = validateObject(value, {
      fields: {
        orders: {
          items: {
            fields: {
              price: {
                type: 'number',
                validate: (value) =>
                  Number(value) >= 0 ? undefined : 'Price must be positive'
              }
            }
          }
        }
      }
    });

    expect(issues).toMatchObject([
      {
        code: 'invalid',
        formattedPath: 'orders[0].price',
        message: 'Price must be positive'
      }
    ]);
  });

  it('reports missing required properties at their intended paths', () => {
    expect(
      validateObject(
        { profile: {} },
        {
          fields: {
            profile: {
              fields: {
                name: { required: true }
              }
            }
          }
        }
      )
    ).toMatchObject([
      {
        code: 'required',
        formattedPath: 'profile.name',
        message: 'Required property is missing'
      }
    ]);
  });

  it('preserves warning severity for field and required issues', () => {
    expect(
      validateObject(
        { score: 4 },
        {
          fields: {
            score: {
              severity: 'warning',
              validate: () => 'Score is below the recommendation'
            },
            note: {
              required: true,
              severity: 'warning'
            }
          }
        }
      )
    ).toMatchObject([
      {
        code: 'required',
        formattedPath: 'note',
        severity: 'warning'
      },
      {
        code: 'invalid',
        formattedPath: 'score',
        severity: 'warning'
      }
    ]);
  });

  it('uses a field message for missing required properties', () => {
    expect(
      validateObject(
        {},
        {
          fields: {
            name: {
              required: true,
              messages: { required: 'Inserire il nome' }
            }
          }
        }
      )
    ).toMatchObject([
      {
        code: 'required',
        message: 'Inserire il nome',
        formattedPath: 'name'
      }
    ]);
  });

  it('validates values discovered through type and wildcard path rules', () => {
    const value = {
      limit: -1,
      orders: [{ discount: 25 }, { discount: 10 }]
    };
    const schema = composeObjectSchemas(
      schemaForType('number', {
        validate: (value) =>
          Number(value) >= 0 ? undefined : 'Number must be positive'
      }),
      schemaForPath(['orders', '*', 'discount'], {
        validate: (value) =>
          Number(value) <= 20 ? undefined : 'Discount is too large'
      })
    );

    expect(validateObject(value, schema)).toMatchObject([
      {
        formattedPath: 'limit',
        message: 'Number must be positive'
      },
      {
        formattedPath: 'orders[0].discount',
        message: 'Discount is too large'
      }
    ]);
  });

  it('validates heterogeneous array positions with tuple schemas', () => {
    const issues = validateObject(
      { row: ['Ada', 'not-a-number', false] },
      {
        fields: {
          row: {
            items: { type: 'boolean' },
            prefixItems: [{ type: 'string' }, { type: 'number' }]
          }
        }
      }
    );

    expect(issues).toMatchObject([
      {
        formattedPath: 'row[1]',
        message: 'Expected number'
      }
    ]);
  });

  it('does not invoke accessors or loop through circular values', () => {
    let reads = 0;
    const value: Record<string, unknown> = {
      get unsafe() {
        reads += 1;
        return 'side effect';
      }
    };
    value.self = value;

    expect(() =>
      validateObject(value, {
        fields: {
          self: {
            fields: {
              self: { fields: { unsafe: { type: 'string' } } }
            }
          },
          unsafe: { type: 'string' }
        }
      })
    ).not.toThrow();
    expect(reads).toBe(0);
  });

  it('returns immutable issues and contains validator failures', () => {
    const issues = validateObject(
      { name: 'Ada' },
      {
        fields: {
          name: {
            validate() {
              throw new Error('Failure');
            }
          }
        }
      }
    );
    const issue = issues[0]!;

    expect(issue.message).toBe('Validation could not be completed');
    expect(Object.isFrozen(issue)).toBe(true);
    expect(Object.isFrozen(issue.path)).toBe(true);
  });
});
